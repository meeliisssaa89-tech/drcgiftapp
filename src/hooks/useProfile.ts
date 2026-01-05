import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegram } from './useTelegram';

export interface Profile {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  crystals: number;
  level: number;
  experience: number;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameHistoryEntry {
  id: string;
  profile_id: string;
  bet_amount: number;
  prize_amount: number;
  prize_emoji: string;
  prize_name: string;
  is_demo: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  reward_earned: number;
  created_at: string;
}

export const useProfile = () => {
  const { user } = useTelegram();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get or create profile based on Telegram user
  const fetchOrCreateProfile = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('telegram_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingProfile) {
        setProfile(existingProfile);
      } else {
        // Create new profile
        const newProfile = {
          telegram_id: user.id,
          username: user.username || null,
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          avatar_url: user.photo_url || null,
          crystals: 1000,
          level: 1,
          experience: 0,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) throw createError;
        setProfile(createdProfile);
      }
    } catch (err) {
      console.error('Error fetching/creating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch game history
  const fetchGameHistory = useCallback(async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setGameHistory(data || []);
    } catch (err) {
      console.error('Error fetching game history:', err);
    }
  }, [profile]);

  // Fetch referrals
  const fetchReferrals = useCallback(async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (err) {
      console.error('Error fetching referrals:', err);
    }
  }, [profile]);

  // Update crystals
  const updateCrystals = useCallback(async (newCrystals: number) => {
    if (!profile) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ crystals: newCrystals })
        .eq('id', profile.id);

      if (error) throw error;
      setProfile(prev => prev ? { ...prev, crystals: newCrystals } : null);
      return true;
    } catch (err) {
      console.error('Error updating crystals:', err);
      return false;
    }
  }, [profile]);

  // Add crystals
  const addCrystals = useCallback(async (amount: number) => {
    if (!profile) return false;
    return updateCrystals(profile.crystals + amount);
  }, [profile, updateCrystals]);

  // Deduct crystals
  const deductCrystals = useCallback(async (amount: number) => {
    if (!profile || profile.crystals < amount) return false;
    return updateCrystals(profile.crystals - amount);
  }, [profile, updateCrystals]);

  // Record game play
  const recordGame = useCallback(async (
    betAmount: number,
    prizeAmount: number,
    prizeEmoji: string,
    prizeName: string,
    isDemo: boolean = false
  ) => {
    if (!profile) return false;

    try {
      const { error } = await supabase
        .from('game_history')
        .insert({
          profile_id: profile.id,
          bet_amount: betAmount,
          prize_amount: prizeAmount,
          prize_emoji: prizeEmoji,
          prize_name: prizeName,
          is_demo: isDemo,
        });

      if (error) throw error;

      // Update experience and level
      const newExperience = profile.experience + 10;
      const newLevel = Math.floor(newExperience / 100) + 1;

      await supabase
        .from('profiles')
        .update({ experience: newExperience, level: newLevel })
        .eq('id', profile.id);

      setProfile(prev => prev ? { 
        ...prev, 
        experience: newExperience, 
        level: newLevel 
      } : null);

      // Refresh game history
      fetchGameHistory();
      return true;
    } catch (err) {
      console.error('Error recording game:', err);
      return false;
    }
  }, [profile, fetchGameHistory]);

  // Process referral
  const processReferral = useCallback(async (referrerTelegramId: number) => {
    if (!profile) return false;

    try {
      // Find referrer profile
      const { data: referrerProfile, error: referrerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('telegram_id', referrerTelegramId)
        .maybeSingle();

      if (referrerError || !referrerProfile) return false;

      // Create referral record
      const { error: refError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerProfile.id,
          referred_id: profile.id,
          reward_earned: 0,
        });

      if (refError) return false;

      // Update profile with referrer
      await supabase
        .from('profiles')
        .update({ referred_by: referrerProfile.id })
        .eq('id', profile.id);

      return true;
    } catch (err) {
      console.error('Error processing referral:', err);
      return false;
    }
  }, [profile]);

  // Process referral bonus (10% of deposit)
  const processReferralBonus = useCallback(async (depositAmount: number) => {
    if (!profile?.referred_by) return;

    try {
      const bonus = Math.floor(depositAmount * 0.1);

      // Update referrer's crystals
      const { data: referrer, error: referrerError } = await supabase
        .from('profiles')
        .select('crystals')
        .eq('id', profile.referred_by)
        .single();

      if (referrerError || !referrer) return;

      await supabase
        .from('profiles')
        .update({ crystals: referrer.crystals + bonus })
        .eq('id', profile.referred_by);

      // Update referral record
      await supabase
        .from('referrals')
        .update({ reward_earned: bonus })
        .eq('referrer_id', profile.referred_by)
        .eq('referred_id', profile.id);
    } catch (err) {
      console.error('Error processing referral bonus:', err);
    }
  }, [profile]);

  // Initial load
  useEffect(() => {
    fetchOrCreateProfile();
  }, [fetchOrCreateProfile]);

  // Load history and referrals when profile is ready
  useEffect(() => {
    if (profile) {
      fetchGameHistory();
      fetchReferrals();
    }
  }, [profile, fetchGameHistory, fetchReferrals]);

  return {
    profile,
    gameHistory,
    referrals,
    isLoading,
    error,
    updateCrystals,
    addCrystals,
    deductCrystals,
    recordGame,
    processReferral,
    processReferralBonus,
    refetch: fetchOrCreateProfile,
  };
};
