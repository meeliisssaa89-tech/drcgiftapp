import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

export interface PvPGame {
  id: string;
  player1_id: string;
  player2_id: string | null;
  player1_name: string;
  player2_name: string | null;
  player1_avatar: string | null;
  player2_avatar: string | null;
  bet_amount: number;
  player1_spin: number | null;
  player2_spin: number | null;
  winner_id: string | null;
  status: 'waiting' | 'ready' | 'spinning' | 'completed';
  created_at: string;
  updated_at: string;
}

const BET_AMOUNTS = [25, 50, 100, 250];

export const usePvPGames = () => {
  const { profile, deductCrystals, addCrystals } = useProfile();
  const [games, setGames] = useState<PvPGame[]>([]);
  const [myGames, setMyGames] = useState<PvPGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all waiting games (for finding opponents)
  const fetchWaitingGames = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('pvp_games')
        .select(`
          id,
          player1_id,
          player2_id,
          player1_name,
          player2_name,
          player1_avatar,
          player2_avatar,
          bet_amount,
          player1_spin,
          player2_spin,
          winner_id,
          status,
          created_at,
          updated_at
        `)
        .eq('status', 'waiting')
        .order('created_at', { ascending: true });

      if (err) throw err;
      setGames(data || []);
    } catch (err) {
      console.error('Error fetching waiting games:', err);
      setError(err instanceof Error ? err.message : 'Failed to load games');
    }
  }, []);

  // Fetch my games (playing or completed)
  const fetchMyGames = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const { data, error: err } = await supabase
        .from('pvp_games')
        .select(`
          id,
          player1_id,
          player2_id,
          player1_name,
          player2_name,
          player1_avatar,
          player2_avatar,
          bet_amount,
          player1_spin,
          player2_spin,
          winner_id,
          status,
          created_at,
          updated_at
        `)
        .or(`player1_id.eq.${profile.id},player2_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (err) throw err;
      setMyGames(data || []);
    } catch (err) {
      console.error('Error fetching my games:', err);
    }
  }, [profile?.id]);

  // Create new game
  const createGame = useCallback(async (betAmount: number) => {
    if (!profile) return null;

    try {
      // Deduct coins
      const success = await deductCrystals(betAmount);
      if (!success) {
        setError('Insufficient coins');
        return null;
      }

      const { data, error: err } = await supabase
        .from('pvp_games')
        .insert({
          player1_id: profile.id,
          player1_name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
          player1_avatar: profile.avatar_url,
          bet_amount: betAmount,
          status: 'waiting',
        })
        .select()
        .single();

      if (err) {
        // Refund if game creation fails
        await addCrystals(betAmount);
        console.error('Supabase insert error:', err);
        throw new Error(err?.message || 'Failed to insert game into database');
      }

      await fetchWaitingGames();
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
      console.error('Error creating game:', errorMsg);
      setError(errorMsg);
      return null;
    }
  }, [profile, deductCrystals, addCrystals, fetchWaitingGames]);

  // Join a waiting game
  const joinGame = useCallback(async (gameId: string) => {
    if (!profile) return null;

    try {
      // Get the game first
      const { data: gameData, error: getErr } = await supabase
        .from('pvp_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (getErr || !gameData) throw new Error('Game not found');

      // Deduct coins
      const success = await deductCrystals(gameData.bet_amount);
      if (!success) {
        setError('Insufficient coins');
        return null;
      }

      // Update game
      const { data, error: err } = await supabase
        .from('pvp_games')
        .update({
          player2_id: profile.id,
          player2_name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
          player2_avatar: profile.avatar_url,
          status: 'ready',
        })
        .eq('id', gameId)
        .select()
        .single();

      if (err) {
        // Refund if join fails
        await addCrystals(gameData.bet_amount);
        throw err;
      }

      await fetchWaitingGames();
      await fetchMyGames();
      return data;
    } catch (err) {
      console.error('Error joining game:', err);
      setError(err instanceof Error ? err.message : 'Failed to join game');
      return null;
    }
  }, [profile, deductCrystals, addCrystals, fetchWaitingGames, fetchMyGames]);

  // Record spin result
  const recordSpin = useCallback(async (gameId: string, spinValue: number) => {
    if (!profile) return null;

    try {
      const { data: gameData } = await supabase
        .from('pvp_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (!gameData) throw new Error('Game not found');

      // Determine if this is player1 or player2
      const isPlayer1 = gameData.player1_id === profile.id;
      const updateData: any = {
        [isPlayer1 ? 'player1_spin' : 'player2_spin']: spinValue,
      };

      // If both players have spun, determine winner
      if (isPlayer1 && gameData.player2_spin !== null) {
        updateData.status = 'completed';
        if (spinValue > gameData.player2_spin) {
          updateData.winner_id = profile.id;
        } else if (spinValue < gameData.player2_spin) {
          updateData.winner_id = gameData.player2_id;
        }
        // If equal, no winner (tie)
      } else if (!isPlayer1 && gameData.player1_spin !== null) {
        updateData.status = 'completed';
        if (spinValue > gameData.player1_spin) {
          updateData.winner_id = profile.id;
        } else if (spinValue < gameData.player1_spin) {
          updateData.winner_id = gameData.player1_id;
        }
        // If equal, no winner (tie)
      }

      const { data, error: err } = await supabase
        .from('pvp_games')
        .update(updateData)
        .eq('id', gameId)
        .select()
        .single();

      if (err) throw err;

      // If game is completed and there's a winner
      if (data.status === 'completed' && data.winner_id) {
        // Award coins to winner
        await addCrystals(gameData.bet_amount * 2);
      }

      await fetchMyGames();
      return data;
    } catch (err) {
      console.error('Error recording spin:', err);
      setError(err instanceof Error ? err.message : 'Failed to record spin');
      return null;
    }
  }, [profile, addCrystals, fetchMyGames]);

  // Cancel a waiting game (refund coins)
  const cancelGame = useCallback(async (gameId: string) => {
    if (!profile) return false;

    try {
      const { data: gameData } = await supabase
        .from('pvp_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (!gameData) throw new Error('Game not found');
      if (gameData.player1_id !== profile.id) throw new Error('Only creator can cancel');

      // Refund coins
      await addCrystals(gameData.bet_amount);

      // Update game status
      const { error: err } = await supabase
        .from('pvp_games')
        .update({ status: 'cancelled' })
        .eq('id', gameId);

      if (err) throw err;

      await fetchWaitingGames();
      await fetchMyGames();
      return true;
    } catch (err) {
      console.error('Error cancelling game:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel game');
      return false;
    }
  }, [profile, addCrystals, fetchWaitingGames, fetchMyGames]);

  // Initial fetch
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        await Promise.all([fetchWaitingGames(), fetchMyGames()]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [fetchWaitingGames, fetchMyGames]);

  // Subscribe to real-time updates
  useEffect(() => {
    const subscription = supabase
      .channel('pvp_games')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pvp_games' },
        () => {
          fetchWaitingGames();
          fetchMyGames();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchWaitingGames, fetchMyGames]);

  return {
    games,
    myGames,
    isLoading,
    error,
    BET_AMOUNTS,
    createGame,
    joinGame,
    recordSpin,
    cancelGame,
    refetch: () => Promise.all([fetchWaitingGames(), fetchMyGames()]),
  };
};
