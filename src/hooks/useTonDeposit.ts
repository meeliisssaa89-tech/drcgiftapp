import { useState, useCallback, useEffect } from 'react';
import { useTonConnectUI, useTonWallet, useTonAddress } from '@tonconnect/ui-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

interface TonDepositSettings {
  enabled: boolean;
  deposit_address: string;
  min_deposit: number;
  max_deposit: number;
  exchange_rate: number;
}

export const useTonDeposit = () => {
  const { profile, refetch: refetchProfile } = useProfile();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const address = useTonAddress();
  const [isDepositing, setIsDepositing] = useState(false);
  const [settings, setSettings] = useState<TonDepositSettings | null>(null);

  const isConnected = !!wallet;

  // Fetch TON deposit settings
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .in('key', ['ton_deposit', 'currency']);

      if (error) throw error;

      let tonSettings: Partial<TonDepositSettings> = {
        enabled: true,
        deposit_address: '',
        min_deposit: 0.1,
        max_deposit: 1000,
        exchange_rate: 100,
      };

      data?.forEach((setting) => {
        if (setting.key === 'ton_deposit') {
          const val = setting.value as Record<string, unknown>;
          tonSettings = { ...tonSettings, ...val };
        }
        if (setting.key === 'currency') {
          const val = setting.value as Record<string, unknown>;
          if (val.exchange_rate) {
            tonSettings.exchange_rate = val.exchange_rate as number;
          }
          if (val.min_deposit) {
            tonSettings.min_deposit = val.min_deposit as number;
          }
          if (val.max_deposit) {
            tonSettings.max_deposit = val.max_deposit as number;
          }
        }
      });

      setSettings(tonSettings as TonDepositSettings);
    } catch (error) {
      console.error('Error fetching TON settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      await tonConnectUI.openModal();
    } catch (error) {
      console.error('Error connecting TON wallet:', error);
      toast.error('Failed to connect wallet');
    }
  }, [tonConnectUI]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      await tonConnectUI.disconnect();
    } catch (error) {
      console.error('Error disconnecting TON wallet:', error);
    }
  }, [tonConnectUI]);

  // Send TON transaction
  const deposit = useCallback(async (amount: string) => {
    if (!isConnected || !wallet || !profile?.id) {
      toast.error('Please connect your wallet first');
      return null;
    }

    if (!settings?.deposit_address) {
      toast.error('Deposit address not configured');
      return null;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Invalid amount');
      return null;
    }

    if (settings.min_deposit && amountNum < settings.min_deposit) {
      toast.error(`Minimum deposit is ${settings.min_deposit} TON`);
      return null;
    }

    if (settings.max_deposit && amountNum > settings.max_deposit) {
      toast.error(`Maximum deposit is ${settings.max_deposit} TON`);
      return null;
    }

    setIsDepositing(true);

    try {
      // Convert TON to nanoTON (1 TON = 10^9 nanoTON)
      const nanoTons = Math.floor(amountNum * 1_000_000_000).toString();

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: settings.deposit_address,
            amount: nanoTons,
          },
        ],
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      
      // Record deposit in database
      if (result.boc) {
        await recordDeposit(result.boc, amount);
        toast.success('Transaction sent successfully!');
        return result.boc;
      }

      return null;
    } catch (error: unknown) {
      console.error('Error making TON deposit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Transaction cancelled';
      toast.error(errorMessage);
      return null;
    } finally {
      setIsDepositing(false);
    }
  }, [isConnected, wallet, profile?.id, settings, tonConnectUI]);

  // Record deposit in database
  const recordDeposit = useCallback(async (txHash: string, amount: string) => {
    if (!profile?.id || !address) return false;

    try {
      const crystalsToCredit = Math.floor(parseFloat(amount) * (settings?.exchange_rate || 100));

      const { error } = await supabase
        .from('wallet_deposits')
        .insert({
          profile_id: profile.id,
          wallet_address: address,
          tx_hash: txHash,
          amount: parseFloat(amount),
          token_symbol: 'TON',
          crystals_credited: crystalsToCredit,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Deposit recorded! Awaiting confirmation...');
      await refetchProfile();
      return true;
    } catch (error) {
      console.error('Error recording deposit:', error);
      return false;
    }
  }, [profile?.id, address, settings, refetchProfile]);

  return {
    // Connection state
    isConnected,
    wallet,
    address,
    
    // Settings
    settings,
    fetchSettings,
    
    // Actions
    connectWallet,
    disconnectWallet,
    deposit,
    
    // Transaction state
    isDepositing,
  };
};
