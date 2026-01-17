import { useState, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

interface DepositSettings {
  enabled: boolean;
  chain_id: number;
  chain_name: string;
  token_address: string;
  token_symbol: string;
  token_decimals: number;
  deposit_address: string;
}

interface CurrencySettings {
  name: string;
  symbol: string;
  icon_url: string;
  exchange_rate: number;
  min_deposit: number;
  max_deposit: number;
  deposit_enabled: boolean;
  deposit_instructions: string;
}

export const useWeb3Deposit = () => {
  const { profile, refetch: refetchProfile } = useProfile();
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSettings, setDepositSettings] = useState<DepositSettings | null>(null);
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings | null>(null);

  const { data: hash, sendTransaction } = useSendTransaction();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Fetch Web3 settings
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .in('key', ['web3', 'currency']);

      if (error) throw error;

      data?.forEach((setting) => {
        if (setting.key === 'web3') {
          setDepositSettings(setting.value as unknown as DepositSettings);
        }
        if (setting.key === 'currency') {
          setCurrencySettings(setting.value as unknown as CurrencySettings);
        }
      });
    } catch (error) {
      console.error('Error fetching web3 settings:', error);
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      const connector = connectors[0]; // Use first available connector (usually injected/MetaMask)
      if (connector) {
        connect({ connector });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    }
  }, [connect, connectors]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Make deposit
  const deposit = useCallback(async (amount: string) => {
    if (!isConnected || !address || !profile?.id || !depositSettings?.deposit_address) {
      toast.error('Please connect your wallet first');
      return false;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Invalid amount');
      return false;
    }

    if (currencySettings) {
      if (amountNum < currencySettings.min_deposit) {
        toast.error(`Minimum deposit is ${currencySettings.min_deposit}`);
        return false;
      }
      if (amountNum > currencySettings.max_deposit) {
        toast.error(`Maximum deposit is ${currencySettings.max_deposit}`);
        return false;
      }
    }

    setIsDepositing(true);

    try {
      // Send transaction
      sendTransaction({
        to: depositSettings.deposit_address as `0x${string}`,
        value: parseEther(amount),
      });

      return true;
    } catch (error) {
      console.error('Error making deposit:', error);
      toast.error('Failed to make deposit');
      setIsDepositing(false);
      return false;
    }
  }, [isConnected, address, profile?.id, depositSettings, currencySettings, sendTransaction]);

  // Record deposit in database
  const recordDeposit = useCallback(async (txHash: string, amount: string) => {
    if (!profile?.id || !address) return false;

    try {
      const crystalsToCredit = Math.floor(parseFloat(amount) * (currencySettings?.exchange_rate || 1));

      const { error } = await supabase
        .from('wallet_deposits')
        .insert({
          profile_id: profile.id,
          wallet_address: address,
          tx_hash: txHash,
          amount: parseFloat(amount),
          token_symbol: depositSettings?.token_symbol || 'ETH',
          crystals_credited: crystalsToCredit,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Deposit submitted! Awaiting confirmation...');
      return true;
    } catch (error) {
      console.error('Error recording deposit:', error);
      return false;
    }
  }, [profile?.id, address, currencySettings, depositSettings]);

  return {
    // Connection state
    isConnected,
    address,
    chain,
    connectors,
    
    // Settings
    depositSettings,
    currencySettings,
    fetchSettings,
    
    // Actions
    connectWallet,
    disconnectWallet,
    deposit,
    recordDeposit,
    
    // Transaction state
    hash,
    isDepositing,
    isConfirming,
    isConfirmed,
  };
};