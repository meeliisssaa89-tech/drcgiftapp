import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DbPrize {
  id: string;
  prize_key: string;
  name: string;
  emoji: string;
  value: number;
  probability: number;
  type: string;
  is_active: boolean;
  sort_order: number;
}

export interface DbTask {
  id: string;
  task_key: string;
  title: string;
  description: string;
  emoji: string;
  reward: number;
  max_progress: number;
  type: string;
  is_active: boolean;
  timer_hours: number | null;
  sort_order: number;
}

export interface DbGiveaway {
  id: string;
  title: string;
  description: string;
  emoji: string;
  prize_amount: number;
  prize_type: string;
  max_participants: number | null;
  current_participants: number;
  start_at: string;
  end_at: string;
  is_active: boolean;
  winner_id: string | null;
}

export interface DbGameSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
}

export interface GameSettings {
  spin_cost: number;
  free_spins_per_day: number;
  referral_reward: number;
  starting_crystals: number;
}

export const useGameData = () => {
  const [prizes, setPrizes] = useState<DbPrize[]>([]);
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [giveaways, setGiveaways] = useState<DbGiveaway[]>([]);
  const [settings, setSettings] = useState<GameSettings>({
    spin_cost: 25,
    free_spins_per_day: 3,
    referral_reward: 100,
    starting_crystals: 500,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchGameData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prizesRes, tasksRes, giveawaysRes, settingsRes] = await Promise.all([
        supabase.from('prizes').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('tasks').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('giveaways').select('*').eq('is_active', true).order('end_at'),
        supabase.from('game_settings').select('*'),
      ]);

      if (prizesRes.data) setPrizes(prizesRes.data as DbPrize[]);
      if (tasksRes.data) setTasks(tasksRes.data as DbTask[]);
      if (giveawaysRes.data) setGiveaways(giveawaysRes.data as DbGiveaway[]);
      
      if (settingsRes.data) {
        const settingsMap: Record<string, unknown> = {};
        settingsRes.data.forEach((s) => {
          const val = s.value as Record<string, unknown>;
          settingsMap[s.key] = val.value ?? val;
        });
        
        setSettings({
          spin_cost: (settingsMap.spin_cost as number) || 25,
          free_spins_per_day: (settingsMap.free_spins_per_day as number) || 3,
          referral_reward: (settingsMap.referral_reward as number) || 100,
          starting_crystals: (settingsMap.starting_crystals as number) || 500,
        });
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGameData();
  }, [fetchGameData]);

  return {
    prizes,
    tasks,
    giveaways,
    settings,
    isLoading,
    refetch: fetchGameData,
  };
};
