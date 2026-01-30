import { useState } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { CrystalBadge } from '@/components/CrystalIcon';
import { cn } from '@/lib/utils';
import { PvPGame } from '@/hooks/usePvPGames';

interface PvPGameCardProps {
  game: PvPGame;
  currentUserId: string;
  onJoin?: () => Promise<void>;
  onSpinReady?: (spinValue: number) => Promise<void>;
}

export const PvPGameCard = ({
  game,
  currentUserId,
  onJoin,
  onSpinReady,
}: PvPGameCardProps) => {
  const [isJoining, setIsJoining] = useState(false);
  const [isSpin, setIsSpin] = useState(false);
  const [spinValue, setSpinValue] = useState<number | null>(null);

  const isMyGame = game.player1_id === currentUserId || game.player2_id === currentUserId;
  const isPlayer1 = game.player1_id === currentUserId;
  const mySpinValue = isPlayer1 ? game.player1_spin : game.player2_spin;
  const opponentSpinValue = isPlayer1 ? game.player2_spin : game.player1_spin;

  const handleJoin = async () => {
    if (!onJoin) return;
    try {
      setIsJoining(true);
      await onJoin();
    } finally {
      setIsJoining(false);
    }
  };

  const handleSpin = async () => {
    if (!onSpinReady) return;
    try {
      setIsSpin(true);
      // Generate random spin value (0-100)
      const value = Math.floor(Math.random() * 101);
      setSpinValue(value);
      
      // Wait a moment for visual effect
      setTimeout(async () => {
        await onSpinReady(value);
      }, 800);
    } finally {
      setIsSpin(false);
    }
  };

  return (
    <div className="card-telegram overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚔️</span>
          <span className="font-semibold capitalize">{game.status}</span>
        </div>
        <CrystalBadge amount={game.bet_amount} size="sm" />
      </div>

      {/* Players */}
      <div className="space-y-3 mb-4">
        {/* Player 1 */}
        <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 overflow-hidden">
            {game.player1_avatar ? (
              <img
                src={game.player1_avatar}
                alt={game.player1_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                {game.player1_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{game.player1_name}</p>
            {game.player1_spin !== null && (
              <p className="text-xs text-primary font-bold">
                Spin: {game.player1_spin}
              </p>
            )}
          </div>
          {game.status === 'ready' && game.player1_id === currentUserId && !game.player1_spin && (
            <button
              onClick={handleSpin}
              disabled={isSpin}
              className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {isSpin ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Spin'}
            </button>
          )}
          {game.winner_id === game.player1_id && (
            <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          )}
        </div>

        {/* VS */}
        <div className="flex items-center justify-center">
          <div className="text-xs font-semibold text-muted-foreground bg-secondary px-3 py-1 rounded-full">
            VS
          </div>
        </div>

        {/* Player 2 */}
        <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 overflow-hidden">
            {game.player2_avatar ? (
              <img
                src={game.player2_avatar}
                alt={game.player2_name || 'Waiting...'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                {game.player2_name?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">
              {game.player2_name || 'Waiting for opponent...'}
            </p>
            {game.player2_spin !== null && (
              <p className="text-xs text-primary font-bold">
                Spin: {game.player2_spin}
              </p>
            )}
          </div>
          {game.status === 'ready' && game.player2_id === currentUserId && !game.player2_spin && (
            <button
              onClick={handleSpin}
              disabled={isSpin}
              className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {isSpin ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Spin'}
            </button>
          )}
          {game.winner_id === game.player2_id && (
            <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Actions */}
      {game.status === 'waiting' && !isMyGame && (
        <button
          onClick={handleJoin}
          disabled={isJoining}
          className={cn(
            'w-full py-3 rounded-xl font-semibold transition-all',
            'bg-primary text-primary-foreground hover:opacity-90',
            isJoining && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isJoining ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Joining...
            </span>
          ) : (
            'Accept Challenge'
          )}
        </button>
      )}

      {/* Game Result */}
      {game.status === 'completed' && (
        <div className="text-center py-3 bg-primary/10 rounded-lg">
          {game.winner_id ? (
            <>
              <p className="text-sm font-semibold text-primary mb-1">Game Result</p>
              {game.winner_id === currentUserId ? (
                <p className="text-lg font-bold text-green-500">🎉 You Won!</p>
              ) : (
                <p className="text-sm text-muted-foreground">Opponent won</p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Tie Game</p>
          )}
        </div>
      )}
    </div>
  );
};
