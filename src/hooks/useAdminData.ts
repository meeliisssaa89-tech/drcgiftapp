import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  created_at: string;
  updated_at: string;
}

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
  created_at: string;
  updated_at: string;
}

export interface DbGameSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface GameHistory {
  id: string;
  profile_id: string;
  bet_amount: number;
  prize_name: string;
  prize_emoji: string;
  prize_amount: number;
  is_demo: boolean;
  created_at: string;
}

export const useAdminData = () => {
  const [tasks, setTasks] = useState<DbTask[]>([]);
  const [prizes, setPrizes] = useState<DbPrize[]>([]);
  const [settings, setSettings] = useState<DbGameSetting[]>([]);
  const [giveaways, setGiveaways] = useState<DbGiveaway[]>([]);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all admin data
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksRes, prizesRes, settingsRes, giveawaysRes, historyRes] = await Promise.all([
        supabase.from('tasks').select('*').order('sort_order'),
        supabase.from('prizes').select('*').order('sort_order'),
        supabase.from('game_settings').select('*').order('key'),
        supabase.from('giveaways').select('*').order('created_at', { ascending: false }),
        supabase.from('game_history').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      if (tasksRes.data) setTasks(tasksRes.data as DbTask[]);
      if (prizesRes.data) setPrizes(prizesRes.data as DbPrize[]);
      if (settingsRes.data) setSettings(settingsRes.data as DbGameSetting[]);
      if (giveawaysRes.data) setGiveaways(giveawaysRes.data as DbGiveaway[]);
      if (historyRes.data) setGameHistory(historyRes.data as GameHistory[]);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tasks CRUD
  const createTask = useCallback(async (task: Omit<DbTask, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase.from('tasks').insert([task as never]).select().single();
    if (error) {
      toast.error('Failed to create task');
      return null;
    }
    setTasks(prev => [...prev, data as DbTask]);
    toast.success('Task created');
    return data;
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<DbTask>) => {
    const { error } = await supabase.from('tasks').update(updates as never).eq('id', id);
    if (error) {
      toast.error('Failed to update task');
      return false;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } as DbTask : t));
    toast.success('Task updated');
    return true;
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete task');
      return false;
    }
    setTasks(prev => prev.filter(t => t.id !== id));
    toast.success('Task deleted');
    return true;
  }, []);

  // Prizes CRUD
  const createPrize = useCallback(async (prize: Omit<DbPrize, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase.from('prizes').insert([prize as never]).select().single();
    if (error) {
      toast.error('Failed to create prize');
      return null;
    }
    setPrizes(prev => [...prev, data as DbPrize]);
    toast.success('Prize created');
    return data;
  }, []);

  const updatePrize = useCallback(async (id: string, updates: Partial<DbPrize>) => {
    const { error } = await supabase.from('prizes').update(updates as never).eq('id', id);
    if (error) {
      toast.error('Failed to update prize');
      return false;
    }
    setPrizes(prev => prev.map(p => p.id === id ? { ...p, ...updates } as DbPrize : p));
    toast.success('Prize updated');
    return true;
  }, []);

  const deletePrize = useCallback(async (id: string) => {
    const { error } = await supabase.from('prizes').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete prize');
      return false;
    }
    setPrizes(prev => prev.filter(p => p.id !== id));
    toast.success('Prize deleted');
    return true;
  }, []);

  // Settings update
  const updateSetting = useCallback(async (id: string, value: Record<string, unknown>) => {
    const { error } = await supabase.from('game_settings').update({ value: value as never }).eq('id', id);
    if (error) {
      toast.error('Failed to update setting');
      return false;
    }
    setSettings(prev => prev.map(s => s.id === id ? { ...s, value } as DbGameSetting : s));
    toast.success('Setting updated');
    return true;
  }, []);

  // Giveaways CRUD
  const createGiveaway = useCallback(async (giveaway: Omit<DbGiveaway, 'id' | 'created_at' | 'updated_at' | 'current_participants' | 'winner_id'>) => {
    const { data, error } = await supabase.from('giveaways').insert([giveaway as never]).select().single();
    if (error) {
      toast.error('Failed to create giveaway');
      return null;
    }
    setGiveaways(prev => [data as DbGiveaway, ...prev]);
    toast.success('Giveaway created');
    return data;
  }, []);

  const updateGiveaway = useCallback(async (id: string, updates: Partial<DbGiveaway>) => {
    const { error } = await supabase.from('giveaways').update(updates as never).eq('id', id);
    if (error) {
      toast.error('Failed to update giveaway');
      return false;
    }
    setGiveaways(prev => prev.map(g => g.id === id ? { ...g, ...updates } as DbGiveaway : g));
    toast.success('Giveaway updated');
    return true;
  }, []);

  const deleteGiveaway = useCallback(async (id: string) => {
    const { error } = await supabase.from('giveaways').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete giveaway');
      return false;
    }
    setGiveaways(prev => prev.filter(g => g.id !== id));
    toast.success('Giveaway deleted');
    return true;
  }, []);

  return {
    tasks,
    prizes,
    settings,
    giveaways,
    gameHistory,
    isLoading,
    fetchAllData,
    createTask,
    updateTask,
    deleteTask,
    createPrize,
    updatePrize,
    deletePrize,
    updateSetting,
    createGiveaway,
    updateGiveaway,
    deleteGiveaway,
  };
};
