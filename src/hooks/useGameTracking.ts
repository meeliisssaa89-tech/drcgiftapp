import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useTaskProgress } from './useTaskProgress';
import { useGameData, DbTask } from './useGameData';

/**
 * Hook to track games played and automatically update task progress
 */
export const useGameTracking = () => {
  const { profile } = useProfile();
  const { tasks } = useGameData();
  const { getTaskProgress, updateProgress, refetch: refetchProgress } = useTaskProgress();

  // Get today's games count
  const getTodayGamesCount = useCallback(async (): Promise<number> => {
    if (!profile?.id) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const { data, error, count } = await supabase
        .from('game_history')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profile.id)
        .gte('created_at', today.toISOString());

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting today games count:', error);
      return 0;
    }
  }, [profile?.id]);

  // Update play game tasks based on games played
  const updatePlayGameTasks = useCallback(async () => {
    if (!profile?.id || tasks.length === 0) return;

    const todayGames = await getTodayGamesCount();
    
    // Find all play_games type tasks
    const playGameTasks = tasks.filter((task: DbTask) => 
      task.action_type === 'play_games' && task.is_active
    );

    for (const task of playGameTasks) {
      const progress = getTaskProgress(task.id);
      const currentProgress = progress?.progress || 0;
      
      // Only update if games count is higher than current progress
      if (todayGames > currentProgress && !progress?.claimed) {
        const newProgress = Math.min(todayGames, task.max_progress);
        if (newProgress > currentProgress) {
          await updateProgress(task.id, newProgress - currentProgress, task.max_progress);
        }
      }
    }
  }, [profile?.id, tasks, getTaskProgress, updateProgress, getTodayGamesCount]);

  // Track a new game played
  const trackGamePlayed = useCallback(async () => {
    // After recording a game, update all play_games tasks
    await updatePlayGameTasks();
    await refetchProgress();
  }, [updatePlayGameTasks, refetchProgress]);

  // Check and update on mount and when profile changes
  useEffect(() => {
    if (profile?.id && tasks.length > 0) {
      updatePlayGameTasks();
    }
  }, [profile?.id, tasks.length, updatePlayGameTasks]);

  return {
    trackGamePlayed,
    getTodayGamesCount,
    updatePlayGameTasks,
  };
};
