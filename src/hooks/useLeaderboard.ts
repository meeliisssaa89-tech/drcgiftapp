import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LeaderboardEntry {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  crystals: number;
  level: number;
  rank: number;
  games_count?: number;
}

export type LeaderboardType = 'crystals' | 'games' | 'gifts';

export const useLeaderboard = (type: LeaderboardType = 'crystals') => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (type === 'crystals') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, telegram_id, username, first_name, last_name, avatar_url, crystals, level')
          .order('crystals', { ascending: false })
          .limit(100);

        if (error) throw error;

        const ranked = (data || []).map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

        setLeaderboard(ranked);
      } else if (type === 'games') {
        // Get games count per profile
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, telegram_id, username, first_name, last_name, avatar_url, crystals, level');

        if (profilesError) throw profilesError;

        const { data: gamesData, error: gamesError } = await supabase
          .from('game_history')
          .select('profile_id');

        if (gamesError) throw gamesError;

        // Count games per profile
        const gamesCounts: Record<string, number> = {};
        (gamesData || []).forEach(game => {
          gamesCounts[game.profile_id] = (gamesCounts[game.profile_id] || 0) + 1;
        });

        // Merge and sort
        const withGames = (profiles || []).map(profile => ({
          ...profile,
          games_count: gamesCounts[profile.id] || 0,
        }));

        withGames.sort((a, b) => b.games_count - a.games_count);

        const ranked = withGames.map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

        setLeaderboard(ranked);
      } else {
        // Gifts leaderboard - for now just use crystals
        const { data, error } = await supabase
          .from('profiles')
          .select('id, telegram_id, username, first_name, last_name, avatar_url, crystals, level')
          .order('level', { ascending: false })
          .limit(100);

        if (error) throw error;

        const ranked = (data || []).map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

        setLeaderboard(ranked);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    isLoading,
    error,
    refetch: fetchLeaderboard,
  };
};
