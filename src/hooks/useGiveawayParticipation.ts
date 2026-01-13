import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { toast } from 'sonner';

export interface GiveawayParticipation {
  id: string;
  giveaway_id: string;
  profile_id: string;
  created_at: string;
}

export const useGiveawayParticipation = () => {
  const { profile } = useProfile();
  const [participations, setParticipations] = useState<GiveawayParticipation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchParticipations = useCallback(async () => {
    if (!profile?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('giveaway_participants')
        .select('*')
        .eq('profile_id', profile.id);

      if (error) throw error;
      if (data) setParticipations(data as GiveawayParticipation[]);
    } catch (error) {
      console.error('Error fetching participations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchParticipations();
  }, [fetchParticipations]);

  const isParticipating = useCallback((giveawayId: string) => {
    return participations.some((p) => p.giveaway_id === giveawayId);
  }, [participations]);

  const joinGiveaway = useCallback(async (giveawayId: string) => {
    if (!profile?.id) {
      toast.error('Please login first');
      return false;
    }

    if (isParticipating(giveawayId)) {
      toast.info('Already participating!');
      return false;
    }

    try {
      // Add participation
      const { error: participationError } = await supabase
        .from('giveaway_participants')
        .insert({
          giveaway_id: giveawayId,
          profile_id: profile.id,
        });

      if (participationError) throw participationError;

      // Get current count and increment
      const { data: giveaway } = await supabase
        .from('giveaways')
        .select('current_participants')
        .eq('id', giveawayId)
        .single();

      if (giveaway) {
        await supabase
          .from('giveaways')
          .update({ current_participants: giveaway.current_participants + 1 })
          .eq('id', giveawayId);
      }

      await fetchParticipations();
      toast.success('Successfully joined giveaway!');
      return true;
    } catch (error) {
      console.error('Error joining giveaway:', error);
      toast.error('Failed to join giveaway');
      return false;
    }
  }, [profile?.id, isParticipating, fetchParticipations]);

  return {
    participations,
    isLoading,
    isParticipating,
    joinGiveaway,
    refetch: fetchParticipations,
  };
};
