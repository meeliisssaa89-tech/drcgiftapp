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
  gift_enabled: boolean;
}

interface TelegramGift {
  id: string;
  name: string;
  stars_cost: number;
  emoji: string;
}

// Predefined Telegram gifts
const TELEGRAM_GIFTS: TelegramGift[] = [
  { id: 'star', name: 'Star', stars_cost: 10, emoji: '⭐' },
  { id: 'gift', name: 'Gift Box', stars_cost: 25, emoji: '🎁' },
  { id: 'heart', name: 'Heart', stars_cost: 50, emoji: '❤️' },
  { id: 'diamond', name: 'Diamond', stars_cost: 100, emoji: '💎' },
  { id: 'rocket', name: 'Rocket', stars_cost: 250, emoji: '🚀' },
  { id: 'trophy', name: 'Trophy', stars_cost: 500, emoji: '🏆' },
];

export const useTelegramStars = () => {
  const { profile, refetch: refetchProfile } = useProfile();
  const { isTelegram, hapticFeedback } = useTelegram();
  const [settings, setSettings] = useState<TelegramStarsSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Telegram Stars settings
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .eq('key', 'telegram_stars')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.value) {
        setSettings(data.value as unknown as TelegramStarsSettings);
      } else {
        // Default settings
        setSettings({
          enabled: true,
          exchange_rate: 10,
          min_deposit: 10,
          max_deposit: 10000,
          gift_enabled: true,
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

  // Check if Telegram WebApp supports payments
  const supportsPayments = useCallback(() => {
    if (!isTelegram || !window.Telegram?.WebApp) return false;
    // Check if openInvoice method exists
    return typeof window.Telegram.WebApp.openInvoice === 'function';
  }, [isTelegram]);

  // Purchase stars (deposit)
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
      // In Telegram WebApp, we would use openInvoice for real payments
      // For now, we'll simulate the process
      if (isTelegram && window.Telegram?.WebApp?.openInvoice) {
        // Create a payment invoice URL (this would normally come from your bot backend)
        // The bot would create an invoice using Bot API createInvoiceLink
        const invoiceUrl = `https://t.me/$stars_deposit?amount=${starsAmount}`;
        
        return new Promise((resolve) => {
          window.Telegram!.WebApp.openInvoice(invoiceUrl, async (status) => {
            if (status === 'paid') {
              await recordStarDeposit(starsAmount, 'telegram_' + Date.now());
              hapticFeedback('success');
              toast.success('Payment successful!');
              resolve(true);
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
        // Simulation for development
        await recordStarDeposit(starsAmount, 'sim_' + Date.now());
        hapticFeedback('success');
        toast.success(`${starsAmount} stars deposited! (Demo mode)`);
        setIsProcessing(false);
        return true;
      }
    } catch (error) {
      console.error('Error purchasing stars:', error);
      toast.error('Failed to process payment');
      setIsProcessing(false);
      return false;
    }
  }, [profile?.id, settings, isTelegram, hapticFeedback]);

  // Record star deposit in database
  const recordStarDeposit = useCallback(async (starsAmount: number, paymentId: string): Promise<boolean> => {
    if (!profile?.id) return false;

    try {
      const crystalsToCredit = Math.floor(starsAmount * (settings?.exchange_rate || 10));

      const { error } = await supabase
        .from('telegram_star_deposits')
        .insert({
          profile_id: profile.id,
          telegram_payment_id: paymentId,
          stars_amount: starsAmount,
          crystals_credited: crystalsToCredit,
          status: 'completed',
          confirmed_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Update user's crystals
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ crystals: (profile.crystals || 0) + crystalsToCredit })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      await refetchProfile();
      return true;
    } catch (error) {
      console.error('Error recording star deposit:', error);
      return false;
    }
  }, [profile?.id, profile?.crystals, settings, refetchProfile]);

  // Send a gift to another user
  const sendGift = useCallback(async (
    recipientTelegramId: number,
    giftId: string,
    message?: string
  ): Promise<boolean> => {
    if (!profile?.id) {
      toast.error('Please log in first');
      return false;
    }

    if (!settings?.gift_enabled) {
      toast.error('Gifts are currently disabled');
      return false;
    }

    const gift = TELEGRAM_GIFTS.find(g => g.id === giftId);
    if (!gift) {
      toast.error('Invalid gift');
      return false;
    }

    setIsProcessing(true);

    try {
      // In real implementation, this would call Bot API to send gift
      // For now, we record the intent
      const { error } = await supabase
        .from('telegram_gifts')
        .insert({
          sender_profile_id: profile.id,
          recipient_telegram_id: recipientTelegramId,
          gift_id: giftId,
          stars_cost: gift.stars_cost,
          message: message || null,
          status: 'pending',
        });

      if (error) throw error;

      hapticFeedback('success');
      toast.success(`${gift.emoji} ${gift.name} sent successfully!`);
      return true;
    } catch (error) {
      console.error('Error sending gift:', error);
      toast.error('Failed to send gift');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [profile?.id, settings, hapticFeedback]);

  return {
    // Settings
    settings,
    isLoading,
    
    // State
    isProcessing,
    supportsPayments: supportsPayments(),
    isTelegram,
    
    // Available gifts
    availableGifts: TELEGRAM_GIFTS,
    
    // Actions
    purchaseStars,
    sendGift,
    refetch: fetchSettings,
  };
};
