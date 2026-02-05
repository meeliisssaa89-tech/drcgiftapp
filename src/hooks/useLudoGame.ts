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

// Rank system based on wins
export const getRankFromWins = (wins: number = 0) => {
  if (wins >= 100) return { label: 'Legend', color: 'from-purple-500 to-pink-500', icon: '👑', tier: 6 };
  if (wins >= 50) return { label: 'Master', color: 'from-yellow-400 to-orange-500', icon: '⭐', tier: 5 };
  if (wins >= 20) return { label: 'Gold', color: 'from-yellow-300 to-yellow-500', icon: '🥇', tier: 4 };
  if (wins >= 10) return { label: 'Silver', color: 'from-gray-300 to-gray-400', icon: '🥈', tier: 3 };
  if (wins >= 5) return { label: 'Bronze', color: 'from-orange-300 to-orange-500', icon: '🥉', tier: 2 };
  return { label: 'Rookie', color: 'from-green-400 to-green-600', icon: '🌟', tier: 1 };
};

// Ludo board positions
// -1 = in home base, 0-51 = on board, 52-56 = in final stretch, 57 = finished
export const BOARD_SIZE = 52;
export const FINISH_POSITION = 57;
export const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47]; // Safe zones

// Player start positions on the shared track
export const PLAYER_START: Record<string, number> = {
  blue: 0,
  red: 26,
};

// Entry to home stretch (position before entering home)
export const HOME_ENTRY: Record<string, number> = {
  blue: 50,
  red: 24,
};

const MATCHMAKING_TIMEOUT = 60000; // 60 seconds timeout

export const useLudoGame = (gameId?: string) => {
  const queryClient = useQueryClient();
  const { profile, refetch: refetchProfile } = useProfile();
  const { hapticFeedback } = useTelegram();
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<number | null>(null);
  const [validMoves, setValidMoves] = useState<number[]>([]);
  const [hasMoved, setHasMoved] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const waitingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const deductionRef = useRef<string | null>(null); // Track which game we've deducted for
  const matchmakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [matchmakingTimedOut, setMatchmakingTimedOut] = useState(false);

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
        (payload) => {
          console.log('Game update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['ludo-game', gameId] });
          // Reset dice state when turn changes
          if (payload.new && payload.old) {
            const newGame = payload.new as unknown as LudoGame;
            const oldGame = payload.old as unknown as LudoGame;
            if (newGame.current_turn !== oldGame.current_turn) {
              setDiceValue(null);
              setValidMoves([]);
              setSelectedToken(null);
              setHasMoved(false);
            }
            // Clear timeout when game starts
            if (oldGame.status === 'waiting' && newGame.status === 'playing') {
              if (matchmakingTimeoutRef.current) {
                clearTimeout(matchmakingTimeoutRef.current);
                matchmakingTimeoutRef.current = null;
              }
            }
          }
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

  // Subscribe to waiting games to detect when someone joins
  useEffect(() => {
    if (!game || game.status !== 'waiting' || !profile) return;

    // Set timeout for matchmaking
    matchmakingTimeoutRef.current = setTimeout(() => {
      setMatchmakingTimedOut(true);
      toast.error('No opponent found. Try again later.');
    }, MATCHMAKING_TIMEOUT);

    // Subscribe to changes on THIS specific waiting game
    waitingChannelRef.current = supabase
      .channel(`waiting-game-${game.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ludo_games',
          filter: `id=eq.${game.id}`,
        },
        (payload) => {
          console.log('Waiting game update:', payload);
          const updated = payload.new as unknown as LudoGame;
          if (updated.status === 'playing' && updated.player2_id) {
            // Opponent found!
            if (matchmakingTimeoutRef.current) {
              clearTimeout(matchmakingTimeoutRef.current);
              matchmakingTimeoutRef.current = null;
            }
            toast.success('Opponent found! Game starting...');
            queryClient.invalidateQueries({ queryKey: ['ludo-game', game.id] });
          }
        }
      )
      .subscribe();

    return () => {
      if (matchmakingTimeoutRef.current) {
        clearTimeout(matchmakingTimeoutRef.current);
        matchmakingTimeoutRef.current = null;
      }
      if (waitingChannelRef.current) {
        supabase.removeChannel(waitingChannelRef.current);
      }
    };
  }, [game?.id, game?.status, profile, queryClient]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (matchmakingTimeoutRef.current) {
        clearTimeout(matchmakingTimeoutRef.current);
      }
    };
  }, []);

  // Get player info
  const isPlayer1 = game?.player1_id === profile?.id;
  const isPlayer2 = game?.player2_id === profile?.id;
  const isMyTurn = game?.status === 'playing' && game?.current_turn === profile?.id;
  const myColor = isPlayer1 ? game?.game_state.player1_color : game?.game_state.player2_color;
  const myTokens = isPlayer1 ? game?.game_state.player1_tokens : game?.game_state.player2_tokens;
  const opponentTokens = isPlayer1 ? game?.game_state.player2_tokens : game?.game_state.player1_tokens;

  // Check if dice can be rolled
  const canRollDice = isMyTurn && !isRolling && diceValue === null && !hasMoved;

  // Find or create game with proper queue matching
  const findWaitingGame = useMutation({
    mutationFn: async (entryFee: number) => {
      if (!profile) throw new Error('Not logged in');
      
      setMatchmakingTimedOut(false);
      
      // Check if user has enough crystals
      if (profile.crystals < entryFee) {
        throw new Error('Not enough crystals');
      }

      // Check if user already has an active game
      const { data: existingUserGame, error: existingError } = await supabase
        .from('ludo_games')
        .select('*')
        .or(`player1_id.eq.${profile.id},player2_id.eq.${profile.id}`)
        .in('status', ['waiting', 'playing'])
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }

      if (existingUserGame) {
        // Return existing game
        return {
          ...existingUserGame,
          game_state: existingUserGame.game_state as unknown as LudoGameState,
        } as LudoGame;
      }

      // Look for existing waiting game with same entry fee (not created by this user and not stale)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: existingGames, error: searchError } = await supabase
        .from('ludo_games')
        .select('*')
        .eq('status', 'waiting')
        .eq('entry_fee', entryFee)
        .neq('player1_id', profile.id)
        .gte('created_at', fiveMinutesAgo)
        .order('created_at', { ascending: true })
        .limit(1);

      if (searchError) throw searchError;

      if (existingGames && existingGames.length > 0) {
        // Join existing game
        const gameToJoin = existingGames[0];
        
        // Deduct crystals from joining player FIRST
        const newBalance = profile.crystals - entryFee;
        if (newBalance < 0) {
          throw new Error('Not enough crystals');
        }

        const { error: deductError } = await supabase
          .from('profiles')
          .update({ crystals: newBalance })
          .eq('id', profile.id)
          .eq('crystals', profile.crystals); // Optimistic locking

        if (deductError) throw new Error('Failed to deduct crystals');
        
        // Track that we've deducted for this game
        deductionRef.current = gameToJoin.id;

        // Join the game
        const { data, error } = await supabase
          .from('ludo_games')
          .update({
            player2_id: profile.id,
            status: 'playing',
            current_turn: gameToJoin.player1_id,
            prize_pool: gameToJoin.entry_fee * 2,
          })
          .eq('id', gameToJoin.id)
          .eq('status', 'waiting') // Ensure still waiting
          .select()
          .single();

        if (error) {
          // Refund if join failed
          await supabase
            .from('profiles')
            .update({ crystals: profile.crystals })
            .eq('id', profile.id);
          deductionRef.current = null;
          throw error;
        }

        // Refresh profile to get updated balance
        refetchProfile();
        
        return {
          ...data,
          game_state: data.game_state as unknown as LudoGameState,
        } as LudoGame;
      } else {
        // Create new game
        const newBalance = profile.crystals - entryFee;
        if (newBalance < 0) {
          throw new Error('Not enough crystals');
        }

        const { error: deductError } = await supabase
          .from('profiles')
          .update({ crystals: newBalance })
          .eq('id', profile.id)
          .eq('crystals', profile.crystals); // Optimistic locking

        if (deductError) throw new Error('Failed to deduct crystals');

        const { data, error } = await supabase
          .from('ludo_games')
          .insert({
            player1_id: profile.id,
            entry_fee: entryFee,
            prize_pool: entryFee,
            status: 'waiting',
            game_state: {
              player1_tokens: [-1, -1, -1, -1],
              player2_tokens: [-1, -1, -1, -1],
              player1_color: 'blue',
              player2_color: 'red',
              last_dice_roll: null,
              consecutive_sixes: 0,
              move_history: [],
            },
          })
          .select()
          .single();

        if (error) {
          // Refund if create failed
          await supabase
            .from('profiles')
            .update({ crystals: profile.crystals })
            .eq('id', profile.id);
          throw error;
        }

        // Track deduction
        deductionRef.current = data.id;
        
        // Refresh profile
        refetchProfile();

        return {
          ...data,
          game_state: data.game_state as unknown as LudoGameState,
        } as LudoGame;
      }
    },
    onSuccess: (game) => {
      hapticFeedback('success');
      if (game.status === 'waiting') {
        toast.success('Waiting for opponent...');
      } else {
        toast.success('Match found! Game started!');
      }
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
    
    // Token already finished
    if (currentPos === FINISH_POSITION) return false;
    
    // Token in home base - can only move out with 6
    if (currentPos === -1) {
      return dice === 6;
    }

    // Calculate new position
    const startPos = PLAYER_START[myColor];
    const homeEntryPos = HOME_ENTRY[myColor];
    
    // Calculate relative position (steps from start)
    let relativePos: number;
    if (currentPos >= 52) {
      // Already in home stretch
      relativePos = 51 + (currentPos - 51);
    } else {
      relativePos = (currentPos - startPos + BOARD_SIZE) % BOARD_SIZE;
    }
    
    const newRelativePos = relativePos + dice;

    // Check if entering or in home stretch
    if (currentPos >= 52) {
      // Already in home stretch - can only move if won't overshoot
      const homeProgress = currentPos - 51 + dice;
      return homeProgress <= 6; // 6 steps in home stretch
    }

    // Check if would enter home stretch
    if (relativePos < 51 && newRelativePos >= 51) {
      const homeProgress = newRelativePos - 50;
      return homeProgress <= 6;
    }

    return true;
  }, [game, myTokens, myColor]);

  // Roll dice
  const rollDice = useCallback(async () => {
    if (!game || !canRollDice) {
      console.log('Cannot roll dice:', { game: !!game, canRollDice });
      return;
    }

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

        console.log('Dice rolled:', finalValue, 'Valid moves:', moves);

        // If no valid moves, pass turn after delay
        if (moves.length === 0) {
          toast.info('No valid moves available');
          setTimeout(() => passTurn(finalValue), 1500);
        }
      }
    }, rollInterval);
  }, [game, canRollDice, myTokens, hapticFeedback, calculateValidMoves]);

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
      toast.info('Three 6s! Lost your turn');
    }

    const { error } = await supabase
      .from('ludo_games')
      .update({
        current_turn: nextTurn,
        game_state: newState,
      })
      .eq('id', game.id);

    if (!error) {
      setDiceValue(null);
      setValidMoves([]);
      setSelectedToken(null);
      setHasMoved(true);
    }
  };

  // Move token
  const moveToken = useMutation({
    mutationFn: async (tokenIndex: number) => {
      if (!game || !profile || !myTokens || !myColor || diceValue === null) {
        throw new Error('Invalid game state');
      }

      const currentPos = myTokens[tokenIndex];
      let newPos: number;
      const startPos = PLAYER_START[myColor];

      if (currentPos === -1) {
        // Move out of home base to start position
        newPos = startPos;
      } else if (currentPos >= 52) {
        // In home stretch
        newPos = currentPos + diceValue;
        if (newPos > FINISH_POSITION) newPos = FINISH_POSITION;
      } else {
        // On main track
        let relativePos = (currentPos - startPos + BOARD_SIZE) % BOARD_SIZE;
        let newRelativePos = relativePos + diceValue;

        if (newRelativePos >= 51) {
          // Enter home stretch
          const homeProgress = newRelativePos - 50;
          newPos = 51 + homeProgress;
          if (newPos > FINISH_POSITION) newPos = FINISH_POSITION;
        } else {
          newPos = (startPos + newRelativePos) % BOARD_SIZE;
        }
      }

      // Update tokens
      const newTokens = [...myTokens];
      newTokens[tokenIndex] = newPos;

      // Check for capture (if landing on opponent token on main track, not safe)
      let opponentNewTokens = [...(opponentTokens || [])];
      if (newPos < 52 && newPos !== startPos && !SAFE_POSITIONS.includes(newPos)) {
        const capturedIndex = opponentNewTokens.findIndex(pos => pos === newPos);
        if (capturedIndex !== -1) {
          opponentNewTokens[capturedIndex] = -1; // Send captured token home
          toast.success('Captured opponent token!');
          hapticFeedback('success');
        }
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
      
      // Keep turn if rolled 6 (and under 3 consecutive) or captured
      const capturedOpponent = opponentNewTokens.some((pos, idx) => 
        pos === -1 && opponentTokens?.[idx] !== -1
      );
      
      if ((diceValue === 6 && newState.consecutive_sixes < 3) || capturedOpponent) {
        nextTurn = profile.id;
        if (diceValue === 6) {
          toast.info('Rolled 6! Roll again');
        }
      }

      // Three consecutive 6s = lose turn
      if (newState.consecutive_sixes >= 3) {
        newState.consecutive_sixes = 0;
        nextTurn = game.player1_id === profile.id ? game.player2_id : game.player1_id;
        toast.info('Three 6s! Lost your turn');
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
        const winnings = Math.floor(game.prize_pool * 0.95); // 5% house fee
        const { error: winError } = await supabase
          .from('profiles')
          .update({ crystals: (profile.crystals || 0) + winnings })
          .eq('id', profile.id);
        
        if (!winError) {
          toast.success(`You won ${winnings} crystals! 🎉`);
          refetchProfile();
        }
      }

      return { newPos, isWin, keepTurn: nextTurn === profile.id };
    },
    onSuccess: ({ isWin, keepTurn }) => {
      hapticFeedback(isWin ? 'success' : 'medium');
      setValidMoves([]);
      setSelectedToken(null);
      
      if (keepTurn) {
        setDiceValue(null);
        setHasMoved(false);
      } else {
        setDiceValue(null);
        setHasMoved(true);
      }
      
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

  // Cancel/leave game - only refunds if waiting
  const cancelGame = useMutation({
    mutationFn: async () => {
      if (!game || !profile) throw new Error('Invalid state');

      if (game.status === 'waiting' && game.player1_id === profile.id) {
        // Only creator can cancel waiting game
        // Refund crystals
        const { error: refundError } = await supabase
          .from('profiles')
          .update({ crystals: (profile.crystals || 0) + game.entry_fee })
          .eq('id', profile.id);
        
        if (refundError) {
          console.error('Refund error:', refundError);
        }

        await supabase
          .from('ludo_games')
          .update({ status: 'cancelled' })
          .eq('id', game.id);
        
        deductionRef.current = null;
        refetchProfile();
      } else if (game.status === 'playing') {
        // Forfeit - opponent wins
        const opponentId = game.player1_id === profile.id ? game.player2_id : game.player1_id;
        
        await supabase
          .from('ludo_games')
          .update({ 
            status: 'finished',
            winner_id: opponentId,
            finished_at: new Date().toISOString(),
          })
          .eq('id', game.id);

        // Award prize to opponent
        if (opponentId && game.prize_pool) {
          const winnings = Math.floor(game.prize_pool * 0.95);
          const { data: opponent } = await supabase
            .from('profiles')
            .select('crystals')
            .eq('id', opponentId)
            .single();
          
          if (opponent) {
            await supabase
              .from('profiles')
              .update({ crystals: opponent.crystals + winnings })
              .eq('id', opponentId);
          }
        }

        toast.info('You forfeited the game');
      }
    },
    onSuccess: () => {
      if (game?.status === 'waiting') {
        toast.success('Game cancelled, crystals refunded');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Forfeit game
  const forfeitGame = useMutation({
    mutationFn: async () => {
      if (!game || !profile || game.status !== 'playing') {
        throw new Error('Cannot forfeit');
      }

      const opponentId = game.player1_id === profile.id ? game.player2_id : game.player1_id;
      
      const { error } = await supabase
        .from('ludo_games')
        .update({ 
          status: 'finished',
          winner_id: opponentId,
          finished_at: new Date().toISOString(),
        })
        .eq('id', game.id);

      if (error) throw error;

      // Award prize to opponent
      if (opponentId && game.prize_pool) {
        const winnings = Math.floor(game.prize_pool * 0.95);
        const { data: opponent } = await supabase
          .from('profiles')
          .select('crystals')
          .eq('id', opponentId)
          .single();
        
        if (opponent) {
          await supabase
            .from('profiles')
            .update({ crystals: opponent.crystals + winnings })
            .eq('id', opponentId);
        }
      }
    },
    onSuccess: () => {
      toast.info('You forfeited the game');
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
    canRollDice,
    matchmakingTimedOut,
    setSelectedToken,
    rollDice,
    moveToken: moveToken.mutate,
    sendMessage: sendMessage.mutate,
    findWaitingGame: findWaitingGame.mutateAsync,
    cancelGame: cancelGame.mutate,
    forfeitGame: forfeitGame.mutate,
    isFindingGame: findWaitingGame.isPending,
  };
};
