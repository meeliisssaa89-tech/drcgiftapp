import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

export interface TaskProgress {
  id: string;
  task_id: string;
  profile_id: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  completed_at: string | null;
}

export const useTaskProgress = () => {
  const { profile, addCrystals } = useProfile();
  const [taskProgress, setTaskProgress] = useState<TaskProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTaskProgress = useCallback(async () => {
    if (!profile?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks_progress')
        .select('*')
        .eq('profile_id', profile.id);

      if (error) throw error;
      if (data) setTaskProgress(data as TaskProgress[]);
    } catch (error) {
      console.error('Error fetching task progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchTaskProgress();
  }, [fetchTaskProgress]);

  const getTaskProgress = useCallback((taskId: string) => {
    return taskProgress.find((tp) => tp.task_id === taskId);
  }, [taskProgress]);

  const startTask = useCallback(async (taskId: string) => {
    if (!profile?.id) return false;

    const existing = getTaskProgress(taskId);
    if (existing) return true;

    try {
      const { error } = await supabase
        .from('tasks_progress')
        .insert({
          task_id: taskId,
          profile_id: profile.id,
          progress: 0,
          completed: false,
          claimed: false,
        });

      if (error) throw error;
      await fetchTaskProgress();
      return true;
    } catch (error) {
      console.error('Error starting task:', error);
      return false;
    }
  }, [profile?.id, getTaskProgress, fetchTaskProgress]);

  const updateProgress = useCallback(async (taskId: string, increment: number = 1, maxProgress: number = 1) => {
    if (!profile?.id) return false;

    const existing = getTaskProgress(taskId);
    const currentProgress = existing?.progress || 0;
    const newProgress = Math.min(currentProgress + increment, maxProgress);
    const completed = newProgress >= maxProgress;

    try {
      if (existing) {
        const { error } = await supabase
          .from('tasks_progress')
          .update({
            progress: newProgress,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tasks_progress')
          .insert({
            task_id: taskId,
            profile_id: profile.id,
            progress: newProgress,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
            claimed: false,
          });

        if (error) throw error;
      }

      await fetchTaskProgress();
      return true;
    } catch (error) {
      console.error('Error updating task progress:', error);
      return false;
    }
  }, [profile?.id, getTaskProgress, fetchTaskProgress]);

  const claimReward = useCallback(async (taskId: string, reward: number) => {
    if (!profile?.id) return false;

    const progress = getTaskProgress(taskId);
    if (!progress?.completed || progress.claimed) return false;

    try {
      const { error } = await supabase
        .from('tasks_progress')
        .update({ claimed: true })
        .eq('id', progress.id);

      if (error) throw error;
      
      await addCrystals(reward);
      await fetchTaskProgress();
      toast.success(`+${reward} crystals claimed!`);
      return true;
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Failed to claim reward');
      return false;
    }
  }, [profile?.id, getTaskProgress, addCrystals, fetchTaskProgress]);

  return {
    taskProgress,
    isLoading,
    getTaskProgress,
    startTask,
    updateProgress,
    claimReward,
    refetch: fetchTaskProgress,
  };
};
