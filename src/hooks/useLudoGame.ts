import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { useTelegram } from './useTelegram';
import { toast } from 'sonner';

export interface LudoGameState {
  player1_tokens: number[];
  player2_tokens: number[];
  player1_color: string;
  player2_color: string;
  last_dice_roll: number | null;
  consecutive_sixes: number;
  move_history: Array<{
    player: string;
    dice: number;
    token: number;
    from: number;
    to: number;
  }>;
}

export interface LudoGame {
  id: string;
  player1_id: string;
  player2_id: string | null;
  entry_fee: number;
  prize_pool: number;
  status: 'waiting' | 'playing' | 'finished' | 'cancelled';
  current_turn: string | null;
  winner_id: string | null;
  game_state: LudoGameState;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
}

export interface ChatMessage {
  id: string;
  game_id: string;
  sender_id: string;
  message: string;
  message_type: 'text' | 'emoji' | 'system';
  created_at: string;
}

// Ludo board positions
// -1 = in home base, 0-55 = on board, 56-61 = in final stretch, 62 = finished
export const BOARD_SIZE = 56;
export const FINISH_POSITION = 62;
export const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47]; // Safe zones

// Player start positions on the shared track
export const PLAYER_START: Record<string, number> = {
  blue: 0,
  red: 26,
};

// Entry to home stretch
export const HOME_ENTRY: Record<string, number> = {
  blue: 50,
  red: 24,
};

export const useLudoGame = (gameId?: string) => {
  const queryClient = useQueryClient();
  const { profile, updateCrystals } = useProfile();
  const { hapticFeedback } = useTelegram();
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<number[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch current game
  const { data: game, isLoading, refetch } = useQuery({
    queryKey: ['ludo-game', gameId],
    queryFn: async () => {
      if (!gameId) return null;
      const { data, error } = await supabase
        .from('ludo_games')
        .select('*')
        .eq('id', gameId)
        .single();

      if (error) throw error;
      return {
        ...data,
        game_state: data.game_state as unknown as LudoGameState,
      } as LudoGame;
    },
    enabled: !!gameId,
    refetchInterval: false,
  });

  // Fetch chat messages
  const { data: messages = [] } = useQuery({
    queryKey: ['ludo-chat', gameId],
    queryFn: async () => {
      if (!gameId) return [];
      const { data, error } = await supabase
        .from('ludo_chat_messages')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!gameId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!gameId) return;

    channelRef.current = supabase
      .channel(`ludo-game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ludo_games',
          filter: `id=eq.${gameId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ludo-game', gameId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ludo_chat_messages',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ludo-chat', gameId] });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [gameId, queryClient]);

  // Get player info
  const isPlayer1 = game?.player1_id === profile?.id;
  const isPlayer2 = game?.player2_id === profile?.id;
  const isMyTurn = game?.current_turn === profile?.id;
  const myColor = isPlayer1 ? game?.game_state.player1_color : game?.game_state.player2_color;
  const myTokens = isPlayer1 ? game?.game_state.player1_tokens : game?.game_state.player2_tokens;
  const opponentTokens = isPlayer1 ? game?.game_state.player2_tokens : game?.game_state.player1_tokens;

  // Find waiting games
  const findWaitingGame = useMutation({
    mutationFn: async (entryFee: number) => {
      if (!profile) throw new Error('Not logged in');
      
      // Check if user has enough crystals
      if (profile.crystals < entryFee) {
        throw new Error('Not enough crystals');
      }

      // Look for existing waiting game with same entry fee
      const { data: existingGames, error: searchError } = await supabase
        .from('ludo_games')
        .select('*')
        .eq('status', 'waiting')
        .eq('entry_fee', entryFee)
        .neq('player1_id', profile.id)
        .limit(1);

      if (searchError) throw searchError;

      if (existingGames && existingGames.length > 0) {
        // Join existing game
        const gameToJoin = existingGames[0];
        
        // Deduct crystals
        await updateCrystals(-entryFee);

        const { data, error } = await supabase
          .from('ludo_games')
          .update({
            player2_id: profile.id,
            status: 'playing',
            current_turn: gameToJoin.player1_id,
            prize_pool: gameToJoin.entry_fee * 2,
          })
          .eq('id', gameToJoin.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new game
        await updateCrystals(-entryFee);

        const { data, error } = await supabase
          .from('ludo_games')
          .insert({
            player1_id: profile.id,
            entry_fee: entryFee,
            prize_pool: entryFee,
            status: 'waiting',
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (game) => {
      hapticFeedback('success');
      toast.success(game.status === 'waiting' ? 'Waiting for opponent...' : 'Game started!');
    },
    onError: (error: Error) => {
      hapticFeedback('error');
      toast.error(error.message);
    },
  });

  // Calculate valid moves for a token
  const calculateValidMoves = useCallback((tokenIndex: number, dice: number): boolean => {
    if (!game || !myTokens || !myColor) return false;

    const currentPos = myTokens[tokenIndex];
    
    // Token in home base - can only move out with 6
    if (currentPos === -1) {
      return dice === 6;
    }

    // Calculate new position
    const startPos = PLAYER_START[myColor];
    const homeEntry = HOME_ENTRY[myColor];
    
    // Convert to relative position (from player's start)
    let relativePos = (currentPos - startPos + BOARD_SIZE) % BOARD_SIZE;
    let newRelativePos = relativePos + dice;

    // Check if entering home stretch
    if (relativePos <= 50 && newRelativePos > 50) {
      const homeProgress = newRelativePos - 50;
      if (homeProgress > 6) return false; // Can't overshoot
      return true;
    }

    // Already in home stretch
    if (currentPos >= 56) {
      const homeProgress = currentPos - 56 + dice;
      if (homeProgress > 6) return false; // Can't overshoot
      return true;
    }

    return true;
  }, [game, myTokens, myColor]);

  // Roll dice
  const rollDice = useCallback(async () => {
    if (!game || !isMyTurn || isRolling) return;

    setIsRolling(true);
    hapticFeedback('medium');

    // Simulate dice roll animation
    const rollDuration = 1000;
    const rollInterval = 100;
    let elapsed = 0;

    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      elapsed += rollInterval;
      
      if (elapsed >= rollDuration) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalValue);
        setIsRolling(false);
        hapticFeedback('success');

        // Find valid moves
        const moves: number[] = [];
        myTokens?.forEach((_, index) => {
          if (calculateValidMoves(index, finalValue)) {
            moves.push(index);
          }
        });
        setValidMoves(moves);

        // If no valid moves, pass turn
        if (moves.length === 0) {
          setTimeout(() => passTurn(finalValue), 1500);
        }
      }
    }, rollInterval);
  }, [game, isMyTurn, isRolling, myTokens, hapticFeedback, calculateValidMoves]);

  // Pass turn to opponent
  const passTurn = async (dice: number) => {
    if (!game || !profile) return;

    const nextTurn = game.player1_id === profile.id ? game.player2_id : game.player1_id;
    
    const newState = {
      ...game.game_state,
      last_dice_roll: dice,
      consecutive_sixes: dice === 6 ? game.game_state.consecutive_sixes + 1 : 0,
    };

    // Three consecutive sixes = lose turn
    if (newState.consecutive_sixes >= 3) {
      newState.consecutive_sixes = 0;
    }

    await supabase
      .from('ludo_games')
      .update({
        current_turn: nextTurn,
        game_state: newState,
      })
      .eq('id', game.id);

    setDiceValue(null);
    setValidMoves([]);
    setSelectedToken(null);
  };

  // Move token
  const moveToken = useMutation({
    mutationFn: async (tokenIndex: number) => {
      if (!game || !profile || !myTokens || !myColor || diceValue === null) {
        throw new Error('Invalid game state');
      }

      const currentPos = myTokens[tokenIndex];
      let newPos: number;

      if (currentPos === -1) {
        // Move out of home base
        newPos = PLAYER_START[myColor];
      } else if (currentPos >= 56) {
        // In home stretch
        newPos = currentPos + diceValue;
        if (newPos > FINISH_POSITION) newPos = FINISH_POSITION;
      } else {
        // On main track
        const startPos = PLAYER_START[myColor];
        const homeEntry = HOME_ENTRY[myColor];
        let relativePos = (currentPos - startPos + BOARD_SIZE) % BOARD_SIZE;
        let newRelativePos = relativePos + diceValue;

        if (newRelativePos > 50) {
          // Enter home stretch
          newPos = 56 + (newRelativePos - 51);
        } else {
          newPos = (startPos + newRelativePos) % BOARD_SIZE;
        }
      }

      // Update tokens
      const newTokens = [...myTokens];
      newTokens[tokenIndex] = newPos;

      // Check for capture (if landing on opponent token on main track)
      let opponentNewTokens = [...(opponentTokens || [])];
      if (newPos < 56 && !SAFE_POSITIONS.includes(newPos)) {
        opponentNewTokens = opponentNewTokens.map(pos => 
          pos === newPos ? -1 : pos // Send captured token home
        );
      }

      // Check for win
      const isWin = newTokens.every(pos => pos === FINISH_POSITION);

      // Build new game state
      const isP1 = game.player1_id === profile.id;
      const newState: LudoGameState = {
        ...game.game_state,
        player1_tokens: isP1 ? newTokens : opponentNewTokens,
        player2_tokens: isP1 ? opponentNewTokens : newTokens,
        last_dice_roll: diceValue,
        consecutive_sixes: diceValue === 6 ? game.game_state.consecutive_sixes + 1 : 0,
        move_history: [
          ...game.game_state.move_history,
          {
            player: profile.id,
            dice: diceValue,
            token: tokenIndex,
            from: currentPos,
            to: newPos,
          },
        ],
      };

      // Determine next turn
      let nextTurn = game.player1_id === profile.id ? game.player2_id : game.player1_id;
      
      // Keep turn if rolled 6 and under 3 consecutive
      if (diceValue === 6 && newState.consecutive_sixes < 3) {
        nextTurn = profile.id;
      }

      // Update game
      const updates: Record<string, unknown> = {
        game_state: newState as unknown,
        current_turn: nextTurn,
      };

      if (isWin) {
        updates.status = 'finished';
        updates.winner_id = profile.id;
        updates.finished_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('ludo_games')
        .update(updates)
        .eq('id', game.id);

      if (error) throw error;

      // Award crystals if won
      if (isWin && game.prize_pool) {
        // Deduct house fee (5%)
        const winnings = Math.floor(game.prize_pool * 0.95);
        await updateCrystals(winnings);
        toast.success(`You won ${winnings} crystals! 🎉`);
      }

      return { newPos, isWin };
    },
    onSuccess: ({ isWin }) => {
      hapticFeedback(isWin ? 'success' : 'medium');
      setDiceValue(null);
      setValidMoves([]);
      setSelectedToken(null);
      refetch();
    },
    onError: (error: Error) => {
      hapticFeedback('error');
      toast.error(error.message);
    },
  });

  // Send chat message
  const sendMessage = useMutation({
    mutationFn: async ({ message, type = 'text' }: { message: string; type?: 'text' | 'emoji' }) => {
      if (!gameId || !profile) throw new Error('Invalid state');

      const { error } = await supabase
        .from('ludo_chat_messages')
        .insert({
          game_id: gameId,
          sender_id: profile.id,
          message,
          message_type: type,
        });

      if (error) throw error;
    },
  });

  // Cancel/leave game
  const cancelGame = useMutation({
    mutationFn: async () => {
      if (!game || !profile) throw new Error('Invalid state');

      if (game.status === 'waiting') {
        // Refund crystals
        await updateCrystals(game.entry_fee);
        
        await supabase
          .from('ludo_games')
          .update({ status: 'cancelled' })
          .eq('id', game.id);
      }
    },
    onSuccess: () => {
      toast.success('Game cancelled, crystals refunded');
    },
  });

  return {
    game,
    isLoading,
    messages,
    isPlayer1,
    isPlayer2,
    isMyTurn,
    myColor,
    myTokens,
    opponentTokens,
    isRolling,
    diceValue,
    selectedToken,
    validMoves,
    setSelectedToken,
    rollDice,
    moveToken: moveToken.mutate,
    sendMessage: sendMessage.mutate,
    findWaitingGame: findWaitingGame.mutateAsync,
    cancelGame: cancelGame.mutate,
    isFindingGame: findWaitingGame.isPending,
  };
};
