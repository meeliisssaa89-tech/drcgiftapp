import { useState } from 'react';
import { Users, Loader2, Zap } from 'lucide-react';
import { CrystalIcon, CrystalBadge } from '@/components/CrystalIcon';
import { PvPGameCard } from '@/components/PvPGameCard';
import { cn } from '@/lib/utils';
import { PvPGame, usePvPGames } from '@/hooks/usePvPGames';

interface PvPLobbyProps {
  currentUserId: string;
  currentBalance: number;
}

export const PvPLobby = ({ currentUserId, currentBalance }: PvPLobbyProps) => {
  const { games, myGames, isLoading, BET_AMOUNTS, createGame, joinGame, recordSpin, cancelGame } = usePvPGames();
  const [selectedBet, setSelectedBet] = useState(BET_AMOUNTS[0]);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [activeTab, setActiveTab] = useState<'find' | 'my-games'>('find');

  const handleCreateGame = async () => {
    if (currentBalance < selectedBet) {
      return;
    }

    try {
      setIsCreatingGame(true);
      const game = await createGame(selectedBet);
      if (game) {
        setActiveTab('my-games');
      }
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleJoinGame = async (game: PvPGame) => {
    if (currentBalance < game.bet_amount) {
      return;
    }

    const joined = await joinGame(game.id);
    if (joined) {
      setActiveTab('my-games');
    }
  };

  const handleSpinGame = async (game: PvPGame, spinValue: number) => {
    await recordSpin(game.id, spinValue);
  };

  const availableGames = games.filter(g => g.player1_id !== currentUserId);
  const myActiveGames = myGames.filter(g => g.status !== 'completed');
  const myCompletedGames = myGames.filter(g => g.status === 'completed');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading games...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('find')}
          className={cn(
            'flex-1 py-2 rounded-lg font-semibold transition-all',
            activeTab === 'find'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground'
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <Zap className="w-4 h-4" />
            Find Games
          </span>
        </button>
        <button
          onClick={() => setActiveTab('my-games')}
          className={cn(
            'flex-1 py-2 rounded-lg font-semibold transition-all',
            activeTab === 'my-games'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground'
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            My Games
          </span>
        </button>
      </div>

      {/* Find Games Tab */}
      {activeTab === 'find' && (
        <div className="space-y-4">
          {/* Create Game Section */}
          <div className="card-telegram">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              Create New Challenge
            </h3>

            <p className="text-sm text-muted-foreground mb-4">
              Set your bet amount and wait for an opponent to accept your challenge
            </p>

            {/* Bet Selection */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {BET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setSelectedBet(amount)}
                  disabled={currentBalance < amount}
                  className={cn(
                    'rounded-lg py-2.5 font-medium transition-all flex items-center justify-center gap-1',
                    selectedBet === amount
                      ? 'bg-primary/20 border-2 border-primary text-primary'
                      : 'bg-secondary border-2 border-transparent text-muted-foreground',
                    currentBalance < amount && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <span className="font-semibold text-sm">{amount}</span>
                  <CrystalIcon size={12} />
                </button>
              ))}
            </div>

            {currentBalance < selectedBet && (
              <p className="text-xs text-orange-500 mb-4">
                Insufficient coins. You need {selectedBet - currentBalance} more coins.
              </p>
            )}

            {/* Reward Display */}
            <div className="bg-primary/10 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Potential Winnings:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-primary">{selectedBet * 2}</span>
                  <CrystalIcon size={16} />
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateGame}
              disabled={isCreatingGame || currentBalance < selectedBet}
              className={cn(
                'w-full py-3 rounded-lg font-semibold transition-all',
                'bg-primary text-primary-foreground hover:opacity-90',
                (isCreatingGame || currentBalance < selectedBet) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isCreatingGame ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Challenge...
                </span>
              ) : (
                'Create Challenge'
              )}
            </button>
          </div>

          {/* Available Games */}
          <div>
            <h3 className="font-bold mb-3">
              {availableGames.length > 0
                ? `${availableGames.length} Challenges Waiting`
                : 'No Games Available'}
            </h3>
            <div className="space-y-3">
              {availableGames.length > 0 ? (
                availableGames.map((game) => (
                  <div
                    key={game.id}
                    className="card-telegram flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {game.player1_name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <span>Bet:</span>
                        <CrystalBadge amount={game.bet_amount} size="sm" />
                      </div>
                    </div>
                    <button
                      onClick={() => handleJoinGame(game)}
                      disabled={currentBalance < game.bet_amount}
                      className={cn(
                        'ml-3 px-4 py-2 rounded-lg font-semibold transition-all text-sm flex-shrink-0',
                        currentBalance >= game.bet_amount
                          ? 'bg-primary text-primary-foreground hover:opacity-90'
                          : 'bg-secondary text-muted-foreground cursor-not-allowed'
                      )}
                    >
                      Join
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-secondary/30 rounded-lg">
                  <span className="text-4xl mb-2 block">🎲</span>
                  <p className="text-muted-foreground">Create a challenge to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Games Tab */}
      {activeTab === 'my-games' && (
        <div className="space-y-4">
          {/* Active Games */}
          {myActiveGames.length > 0 && (
            <div>
              <h3 className="font-bold mb-3">Active Challenges</h3>
              <div className="space-y-3">
                {myActiveGames.map((game) => (
                  <PvPGameCard
                    key={game.id}
                    game={game}
                    currentUserId={currentUserId}
                    onJoin={() => handleJoinGame(game)}
                    onSpinReady={(spinValue) => handleSpinGame(game, spinValue)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Games */}
          {myCompletedGames.length > 0 && (
            <div>
              <h3 className="font-bold mb-3 text-muted-foreground">Recent Games</h3>
              <div className="space-y-3">
                {myCompletedGames.slice(0, 3).map((game) => (
                  <PvPGameCard
                    key={game.id}
                    game={game}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </div>
          )}

          {myActiveGames.length === 0 && myCompletedGames.length === 0 && (
            <div className="text-center py-12 bg-secondary/30 rounded-lg">
              <span className="text-5xl mb-3 block">⚔️</span>
              <p className="font-semibold mb-2">No Games Yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create a challenge or join an existing one
              </p>
              <button
                onClick={() => setActiveTab('find')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold"
              >
                Find Challenges
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
