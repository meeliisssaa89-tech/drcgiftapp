import { useState } from 'react';
import { Loader2, Users, TrendingUp, Trophy } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { usePvPGames } from '@/hooks/usePvPGames';
import { useTelegram } from '@/hooks/useTelegram';
import { CrystalIcon, CrystalBadge } from '@/components/CrystalIcon';
import { cn } from '@/lib/utils';

const BET_AMOUNTS = [25, 50, 100, 250];

export const PvPGamesPage = () => {
  const { profile } = useProfile();
  const { hapticFeedback } = useTelegram();
  const { games, myGames, isLoading, BET_AMOUNTS: amounts, createGame, joinGame } = usePvPGames();
  
  const [selectedBet, setSelectedBet] = useState(BET_AMOUNTS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'lobby' | 'my-games'>('lobby');
  
  const crystals = profile?.crystals ?? 0;
  const availableGames = games.filter(g => g.status === 'waiting' && g.player1_id !== profile?.id);
  const myActiveGames = myGames.filter(g => g.status !== 'completed');

  const handleCreateGame = async () => {
    if (crystals < selectedBet) return;
    
    try {
      setIsCreating(true);
      hapticFeedback('selection');
      const game = await createGame(selectedBet);
      if (game) {
        hapticFeedback('notification');
        setActiveTab('my-games');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async (gameId: string, betAmount: number) => {
    if (crystals < betAmount) return;
    
    try {
      hapticFeedback('selection');
      const game = await joinGame(gameId);
      if (game) {
        hapticFeedback('notification');
        setActiveTab('my-games');
      }
    } finally {
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading games...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col items-center py-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 shadow-lg">
          <span className="text-3xl">⚔️</span>
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          PvP Games
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm text-center">
          Challenge players and win coins!
        </p>
      </div>

      {/* Player Info Card - Glass Effect */}
      <div className="relative overflow-hidden rounded-3xl p-4 backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-lg font-bold">{profile?.first_name?.charAt(0)}</span>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm">{profile?.first_name}</p>
              <p className="text-xs text-muted-foreground">Level {profile?.level}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg">{crystals}</span>
              <CrystalIcon size={18} />
            </div>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('lobby')}
          className={cn(
            'flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
            activeTab === 'lobby'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          )}
        >
          <Users className="w-4 h-4" />
          Find Game
        </button>
        <button
          onClick={() => setActiveTab('my-games')}
          className={cn(
            'flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
            activeTab === 'my-games'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          )}
        >
          <Trophy className="w-4 h-4" />
          My Games
        </button>
      </div>

      {/* Lobby Tab */}
      {activeTab === 'lobby' && (
        <div className="space-y-4">
          {/* Create Game Section - Glass Effect */}
          <div className="relative overflow-hidden rounded-3xl p-5 backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2">🎮 Create Challenge</h3>
                <p className="text-sm text-muted-foreground">
                  Set your bet and wait for an opponent
                </p>
              </div>

              {/* Bet Selection */}
              <div className="grid grid-cols-4 gap-2">
                {BET_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedBet(amount)}
                    disabled={crystals < amount}
                    className={cn(
                      'rounded-lg py-2 font-semibold transition-all text-sm flex flex-col items-center justify-center gap-1',
                      selectedBet === amount
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80',
                      crystals < amount && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span>{amount}</span>
                    <CrystalIcon size={12} />
                  </button>
                ))}
              </div>

              {/* Reward Info */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">If you win (85%):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-green-500">{Math.floor(selectedBet * 2 * 0.85)}</span>
                    <CrystalIcon size={14} />
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateGame}
                disabled={isCreating || crystals < selectedBet}
                className={cn(
                  'w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                  'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg',
                  (isCreating || crystals < selectedBet) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <span>Start Challenge</span>
                    <span>⚡</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Available Games */}
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              {availableGames.length > 0 ? `${availableGames.length} Waiting` : 'No Games Available'}
            </h3>
            
            <div className="space-y-3">
              {availableGames.length > 0 ? (
                availableGames.map((game) => (
                  <div
                    key={game.id}
                    className="relative overflow-hidden rounded-2xl p-4 backdrop-blur-xl bg-white/10 border border-white/20 hover:border-white/40 transition-all shadow-lg hover:shadow-xl cursor-pointer"
                    onClick={() => handleJoinGame(game.id, game.bet_amount)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1">{game.player1_name}</p>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground">Bet:</span>
                          <CrystalBadge amount={game.bet_amount} size="sm" />
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinGame(game.id, game.bet_amount);
                        }}
                        disabled={crystals < game.bet_amount}
                        className={cn(
                          'px-4 py-2 rounded-lg font-semibold transition-all text-sm',
                          crystals >= game.bet_amount
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                            : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-50'
                        )}
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 rounded-2xl bg-secondary/30">
                  <span className="text-5xl mb-3 block">🎲</span>
                  <p className="text-muted-foreground">Create a challenge to start playing!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Games Tab */}
      {activeTab === 'my-games' && (
        <div className="space-y-4">
          {myActiveGames.length > 0 ? (
            <div className="space-y-3">
              {myActiveGames.map((game) => (
                <div
                  key={game.id}
                  className="relative overflow-hidden rounded-2xl p-4 backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/20 text-primary">
                        {game.status.toUpperCase()}
                      </span>
                      <CrystalBadge amount={game.bet_amount} size="sm" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{game.player1_name}</span>
                        {game.player1_spin !== null && (
                          <span className="text-xs bg-primary/20 px-2 py-1 rounded text-primary">
                            {game.player1_spin}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span className="text-xs">VS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {game.player2_name || 'Waiting...'}
                        </span>
                        {game.player2_spin !== null && (
                          <span className="text-xs bg-primary/20 px-2 py-1 rounded text-primary">
                            {game.player2_spin}
                          </span>
                        )}
                      </div>
                    </div>

                    {game.status === 'completed' && game.winner_id && (
                      <div className="mt-3 text-center">
                        {game.winner_id === profile?.id ? (
                          <p className="text-sm font-bold text-green-500">🎉 You Won!</p>
                        ) : (
                          <p className="text-sm font-semibold text-muted-foreground">Opponent won</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl bg-secondary/30">
              <span className="text-5xl mb-3 block">⚔️</span>
              <p className="font-semibold mb-2">No Active Games</p>
              <p className="text-sm text-muted-foreground mb-4">
                Join or create a challenge to play
              </p>
              <button
                onClick={() => setActiveTab('lobby')}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold"
              >
                Find Games
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
