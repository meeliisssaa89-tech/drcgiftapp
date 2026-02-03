import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
    setSelectedToken,
    rollDice,
    moveToken,
    sendMessage,
    findWaitingGame,
    cancelGame,
    isFindingGame,
  } = useLudoGame(gameId || undefined);

  const [isSearching, setIsSearching] = useState(false);

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
    navigate('/');
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
        <div className="space-y-6 animate-fade-in">
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
          />
        </div>
      );
    }

    // Active game
    return (
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
        onBack={handleBack}
        onRollDice={rollDice}
        onTokenClick={handleTokenClick}
        onSendMessage={sendMessage}
      />
    );
  }

  // Matchmaking screen
  return (
    <div className="space-y-6 animate-fade-in">
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
      />
    </div>
  );
};
