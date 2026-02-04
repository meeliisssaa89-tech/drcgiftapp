import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLudoGame } from '@/hooks/useLudoGame';
import { useProfile } from '@/hooks/useProfile';
import { LudoMatchmaking } from '@/components/ludo/LudoMatchmaking';
import { LudoGameView } from '@/components/ludo/LudoGameView';

export const LudoGamePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const gameId = searchParams.get('game');
  
  const { profile } = useProfile();
  const {
    game,
    isLoading,
    messages,
    isMyTurn,
    myColor,
    isRolling,
    diceValue,
    selectedToken,
    validMoves,
    canRollDice,
    setSelectedToken,
    rollDice,
    moveToken,
    sendMessage,
    findWaitingGame,
    cancelGame,
    forfeitGame,
    isFindingGame,
  } = useLudoGame(gameId || undefined);

  const [isSearching, setIsSearching] = useState(false);
  const [selectedEntryFee, setSelectedEntryFee] = useState(50);

  // Fetch player profiles for display
  const { data: player1Profile } = useQuery({
    queryKey: ['profile', game?.player1_id],
    queryFn: async () => {
      if (!game?.player1_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('id, username, first_name, avatar_url')
        .eq('id', game.player1_id)
        .single();
      return data;
    },
    enabled: !!game?.player1_id,
  });

  const { data: player2Profile } = useQuery({
    queryKey: ['profile', game?.player2_id],
    queryFn: async () => {
      if (!game?.player2_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('id, username, first_name, avatar_url')
        .eq('id', game.player2_id)
        .single();
      return data;
    },
    enabled: !!game?.player2_id,
  });

  // Get win counts for ranking
  const { data: player1Wins } = useQuery({
    queryKey: ['wins', game?.player1_id],
    queryFn: async () => {
      if (!game?.player1_id) return 0;
      const { count } = await supabase
        .from('ludo_games')
        .select('*', { count: 'exact', head: true })
        .eq('winner_id', game.player1_id)
        .eq('status', 'finished');
      return count || 0;
    },
    enabled: !!game?.player1_id,
  });

  const { data: player2Wins } = useQuery({
    queryKey: ['wins', game?.player2_id],
    queryFn: async () => {
      if (!game?.player2_id) return 0;
      const { count } = await supabase
        .from('ludo_games')
        .select('*', { count: 'exact', head: true })
        .eq('winner_id', game.player2_id)
        .eq('status', 'finished');
      return count || 0;
    },
    enabled: !!game?.player2_id,
  });

  // Handle game found
  useEffect(() => {
    if (game && !gameId) {
      setSearchParams({ game: game.id });
      setIsSearching(false);
    }
  }, [game, gameId, setSearchParams]);

  // Handle game state changes
  useEffect(() => {
    if (game?.status === 'playing' && isSearching) {
      setIsSearching(false);
    }
  }, [game?.status, isSearching]);

  const handleFindGame = async (entryFee: number) => {
    setSelectedEntryFee(entryFee);
    setIsSearching(true);
    try {
      const newGame = await findWaitingGame(entryFee);
      if (newGame) {
        setSearchParams({ game: newGame.id });
        if (newGame.status === 'waiting') {
          // Keep searching state for waiting
        } else {
          setIsSearching(false);
        }
      }
    } catch (error) {
      setIsSearching(false);
    }
  };

  const handleCancel = () => {
    if (game?.status === 'waiting') {
      cancelGame();
    }
    setIsSearching(false);
    setSearchParams({});
  };

  const handleBack = () => {
    if (game?.status === 'waiting') {
      cancelGame();
    }
    navigate('/pvp-games');
  };

  const handleTokenClick = (tokenIndex: number) => {
    if (validMoves.includes(tokenIndex)) {
      if (selectedToken === tokenIndex) {
        // Double click to confirm move
        moveToken(tokenIndex);
      } else {
        setSelectedToken(tokenIndex);
      }
    }
  };

  // Loading
  if (isLoading && gameId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show game view if we have an active game
  if (game && game.status !== 'cancelled') {
    // Waiting for opponent
    if (game.status === 'waiting') {
      return (
        <div className="space-y-6 animate-fade-in px-4 pt-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <LudoMatchmaking
            crystals={profile?.crystals || 0}
            isSearching={true}
            onFindGame={handleFindGame}
            onCancel={handleCancel}
            player1Profile={player1Profile}
            player2Profile={player2Profile}
          />
        </div>
      );
    }

    // Active game
    return (
      <div className="px-4 pt-4">
        <LudoGameView
          game={game}
          messages={messages}
          myId={profile?.id || ''}
          isMyTurn={isMyTurn}
          myColor={myColor}
          isRolling={isRolling}
          diceValue={diceValue}
          selectedToken={selectedToken}
          validMoves={validMoves}
          canRollDice={canRollDice}
          player1Info={player1Profile ? { ...player1Profile, wins: player1Wins || 0 } : null}
          player2Info={player2Profile ? { ...player2Profile, wins: player2Wins || 0 } : null}
          onBack={handleBack}
          onRollDice={rollDice}
          onTokenClick={handleTokenClick}
          onSendMessage={sendMessage}
          onForfeit={forfeitGame}
        />
      </div>
    );
  }

  // Matchmaking screen
  return (
    <div className="space-y-6 animate-fade-in px-4 pt-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <LudoMatchmaking
        crystals={profile?.crystals || 0}
        isSearching={isSearching || isFindingGame}
        onFindGame={handleFindGame}
        onCancel={handleCancel}
        player1Profile={profile ? { 
          username: profile.username, 
          first_name: profile.first_name, 
          avatar_url: profile.avatar_url 
        } : null}
      />
    </div>
  );
};
