import { useState, useEffect } from 'react';
import { useLeaderboard, LeaderboardType, LeaderboardEntry } from '@/hooks/useLeaderboard';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';

const leaderTabs: { id: LeaderboardType; label: string }[] = [
  { id: 'crystals', label: 'Crystals' },
  { id: 'games', label: 'Games' },
  { id: 'gifts', label: 'Gifts' },
];

const getMedalEmoji = (rank: number): string => {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
};

const getAvatarColor = (id: string): string => {
  const colors = [
    'bg-pink-500',
    'bg-purple-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-teal-500',
  ];
  // Use first char of ID to determine color
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
};

export const LeadersPage = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('crystals');
  const [lastUpdated, setLastUpdated] = useState(0);
  const { leaderboard, isLoading, refetch } = useLeaderboard(activeTab);
  const { profile } = useProfile();
  const { user } = useTelegram();

  // Update timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset timer on refetch
  useEffect(() => {
    setLastUpdated(0);
  }, [activeTab]);

  const getValue = (entry: LeaderboardEntry): number => {
    switch (activeTab) {
      case 'crystals':
        return entry.crystals;
      case 'games':
        return entry.games_count || 0;
      case 'gifts':
        return entry.level; // Using level for gifts for now
      default:
        return 0;
    }
  };

  const formatValue = (value: number): string => {
    return value.toLocaleString();
  };

  const displayName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'User';
  const isPremium = user?.is_premium;

  // Find current user's rank
  const myRank = leaderboard.findIndex(e => e.telegram_id === user?.id) + 1;
  const myValue = profile ? (activeTab === 'crystals' ? profile.crystals : activeTab === 'games' ? 0 : profile.level) : 0;

  return (
    <div className="flex flex-col gap-4 pb-24 animate-fade-in">
      {/* Trophy Header */}
      <div className="flex flex-col items-center py-4">
        <span className="text-7xl mb-3">🏆</span>
        <h1 className="text-xl font-bold">Leaderboard</h1>
        <div className="flex items-center gap-1.5 text-muted-foreground mt-1.5 text-sm">
          <span>📊</span>
          <span>{lastUpdated} seconds ago</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-secondary rounded-xl p-1 flex">
        {leaderTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2 rounded-lg font-medium transition-all duration-200 text-sm",
              activeTab === tab.id ? "bg-card text-foreground" : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="card-telegram">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-3 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-24" />
                  <div className="h-3 bg-secondary rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-muted-foreground text-sm">No players yet. Be the first!</p>
          </div>
        ) : (
          <>
            {leaderboard.slice(0, 10).map((entry) => {
              const entryName = entry.first_name || entry.username || 'User';
              return (
                <div key={entry.id} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
                  {/* Avatar */}
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0",
                    getAvatarColor(entry.id)
                  )}>
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt={entryName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      entryName.charAt(0)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">🌍</span>
                      <span className="font-semibold text-sm truncate">{entryName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatValue(getValue(entry))} {activeTab}
                    </span>
                  </div>

                  {/* Rank */}
                  <div className="flex items-center flex-shrink-0">
                    {entry.rank <= 3 ? (
                      <span className="text-2xl">{getMedalEmoji(entry.rank)}</span>
                    ) : (
                      <span className="text-base font-bold text-muted-foreground">#{entry.rank}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Current User - Highlighted */}
        <div className="flex items-center gap-3 py-3 bg-card-elevated rounded-xl mt-2 -mx-2 px-4">
          <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center font-bold text-sm flex-shrink-0">
            {user?.photo_url ? (
              <img src={user.photo_url} alt={displayName} className="w-full h-full rounded-full object-cover" />
            ) : (
              displayName.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm">🇪🇬</span>
              <span className="font-semibold text-sm truncate">{displayName}</span>
              {isPremium && <span>🌟</span>}
            </div>
            <span className="text-xs text-muted-foreground">
              {myValue} {activeTab}
            </span>
          </div>
          <span className="text-base font-bold text-muted-foreground">
            {myRank > 0 ? `#${myRank}` : '#--'}
          </span>
        </div>
      </div>
    </div>
  );
};
