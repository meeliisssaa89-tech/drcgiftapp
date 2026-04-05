import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useTelegram } from './useTelegram';
import { toast } from 'sonner';

interface TelegramStarsSettings {
  enabled: boolean;
  exchange_rate: number;
  min_deposit: number;
  max_deposit: number;
}

export const useTelegramStars = () => {
  const { profile, refetch: refetchProfile } = useProfile();
  const { isTelegram, hapticFeedback } = useTelegram();
  const [settings, setSettings] = useState<TelegramStarsSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .eq('key', 'telegram_stars')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.value) {
        setSettings(data.value as unknown as TelegramStarsSettings);
      } else {
        setSettings({
          enabled: true,
          exchange_rate: 10,
          min_deposit: 10,
          max_deposit: 10000,
        });
      }
    } catch (error) {
      console.error('Error fetching Telegram Stars settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const supportsPayments = useCallback(() => {
    if (!isTelegram || !window.Telegram?.WebApp) return false;
    return typeof window.Telegram.WebApp.openInvoice === 'function';
  }, [isTelegram]);

  const purchaseStars = useCallback(async (starsAmount: number): Promise<boolean> => {
    if (!profile?.id) {
      toast.error('Please log in first');
      return false;
    }

    if (!settings?.enabled) {
      toast.error('Star deposits are currently disabled');
      return false;
    }

    if (starsAmount < (settings?.min_deposit || 10)) {
      toast.error(`Minimum deposit is ${settings?.min_deposit || 10} stars`);
      return false;
    }

    if (starsAmount > (settings?.max_deposit || 10000)) {
      toast.error(`Maximum deposit is ${settings?.max_deposit || 10000} stars`);
      return false;
    }

    setIsProcessing(true);

    try {
      // Create invoice via edge function
      const { data: invoiceData, error: invoiceError } = await supabase.functions.invoke(
        'create-stars-invoice',
        {
          body: {
            stars_amount: starsAmount,
            profile_id: profile.id,
          },
        }
      );

      if (invoiceError || !invoiceData?.invoice_url) {
        console.error('Invoice error:', invoiceError || invoiceData);
        toast.error('Failed to create payment invoice');
        setIsProcessing(false);
        return false;
      }

      // Open invoice in Telegram WebApp
      if (isTelegram && window.Telegram?.WebApp?.openInvoice) {
        return new Promise((resolve) => {
          window.Telegram!.WebApp.openInvoice(invoiceData.invoice_url, async (status) => {
            if (status === 'paid') {
              // Confirm payment on backend
              const paymentId = `tg_${Date.now()}_${starsAmount}`;
              const { data: confirmData, error: confirmError } = await supabase.functions.invoke(
                'confirm-stars-payment',
                {
                  body: {
                    profile_id: profile.id,
                    stars_amount: starsAmount,
                    telegram_payment_id: paymentId,
                  },
                }
              );

              if (confirmError) {
                console.error('Confirm error:', confirmError);
                toast.error('Payment received but failed to credit. Contact support.');
              } else {
                hapticFeedback('success');
                toast.success(`${confirmData?.crystals_credited || starsAmount * (settings?.exchange_rate || 10)} crystals added!`);
                await refetchProfile();
              }
              resolve(!confirmError);
            } else if (status === 'cancelled') {
              toast.info('Payment cancelled');
              resolve(false);
            } else {
              toast.error('Payment failed');
              resolve(false);
            }
            setIsProcessing(false);
          });
        });
      } else {
        // Demo mode for development outside Telegram
        const paymentId = `demo_${Date.now()}_${starsAmount}`;
        const { data: confirmData, error: confirmError } = await supabase.functions.invoke(
          'confirm-stars-payment',
          {
            body: {
              profile_id: profile.id,
              stars_amount: starsAmount,
              telegram_payment_id: paymentId,
            },
          }
        );

        if (confirmError) {
          toast.error('Failed to process demo payment');
        } else {
          hapticFeedback('success');
          toast.success(`${confirmData?.crystals_credited} crystals added! (Demo)`);
          await refetchProfile();
        }
        setIsProcessing(false);
        return !confirmError;
      }
    } catch (error) {
      console.error('Error purchasing stars:', error);
      toast.error('Failed to process payment');
      setIsProcessing(false);
      return false;
    }
  }, [profile?.id, settings, isTelegram, hapticFeedback, refetchProfile]);

  return {
    settings,
    isLoading,
    isProcessing,
    supportsPayments: supportsPayments(),
    isTelegram,
    purchaseStars,
    refetch: fetchSettings,
  };
};
