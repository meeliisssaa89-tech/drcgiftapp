import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyStats {
  date: string;
  games: number;
  prizes: number;
  bets: number;
  newUsers: number;
}

export const useDailyStats = () => {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDailyStats = useCallback(async (days: number = 14) => {
    setIsLoading(true);
    try {
      // Fetch game history stats
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: historyData } = await supabase
        .from('game_history')
        .select('created_at, prize_amount, bet_amount')
        .gte('created_at', startDate.toISOString());

      // Fetch new users stats
      const { data: usersData } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      // Group by date
      const statsMap = new Map<string, DailyStats>();
      
      // Initialize all dates
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        statsMap.set(dateStr, {
          date: dateStr,
          games: 0,
          prizes: 0,
          bets: 0,
          newUsers: 0,
        });
      }

      // Process game history
      if (historyData) {
        historyData.forEach((game) => {
          const dateStr = new Date(game.created_at).toISOString().split('T')[0];
          const stat = statsMap.get(dateStr);
          if (stat) {
            stat.games += 1;
            stat.prizes += game.prize_amount || 0;
            stat.bets += game.bet_amount || 0;
          }
        });
      }

      // Process new users
      if (usersData) {
        usersData.forEach((user) => {
          const dateStr = new Date(user.created_at).toISOString().split('T')[0];
          const stat = statsMap.get(dateStr);
          if (stat) {
            stat.newUsers += 1;
          }
        });
      }

      const result = Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      setDailyStats(result);
    } catch (error) {
      console.error('Error fetching daily stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    dailyStats,
    isLoading,
    fetchDailyStats,
  };
};
