import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CurrencySettings {
  name: string;
  symbol: string;
  icon_url: string;
  exchange_rate: number;
  min_deposit: number;
  max_deposit: number;
  deposit_enabled: boolean;
  deposit_instructions: string;
}

const defaultSettings: CurrencySettings = {
  name: 'Crystals',
  symbol: '💎',
  icon_url: '',
  exchange_rate: 1,
  min_deposit: 100,
  max_deposit: 100000,
  deposit_enabled: false,
  deposit_instructions: 'Connect your wallet to deposit tokens',
};

export const useCurrencySettings = () => {
  const [settings, setSettings] = useState<CurrencySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .eq('key', 'currency')
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('Error fetching currency settings:', error);
        }
        return;
      }

      if (data?.value) {
        setSettings(data.value as unknown as CurrencySettings);
      }
    } catch (error) {
      console.error('Error fetching currency settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    refetch: fetchSettings,
  };
};