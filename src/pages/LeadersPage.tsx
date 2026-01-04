import { useState, useEffect } from 'react';
import { LEADERBOARD, LeaderEntry, useGameStore } from '@/store/gameStore';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';

type LeaderTab = 'crystals' | 'games' | 'gifts';

const leaderTabs: { id: LeaderTab; label: string }[] = [
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

const getAvatarColor = (id: number): string => {
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
  return colors[id % colors.length];
};

export const LeadersPage = () => {
  const [activeTab, setActiveTab] = useState<LeaderTab>('crystals');
  const [lastUpdated, setLastUpdated] = useState(54);
  const { crystals, gamesPlayed, gifts } = useGameStore();
  const { user } = useTelegram();

  // Simulate last updated timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getSortedLeaderboard = (): LeaderEntry[] => {
    const sorted = [...LEADERBOARD].sort((a, b) => {
      switch (activeTab) {
        case 'crystals':
          return b.crystals - a.crystals;
        case 'games':
          return b.games - a.games;
        case 'gifts':
          return b.gifts - a.gifts;
        default:
          return 0;
      }
    });
    return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));
  };

  const getValue = (entry: LeaderEntry): number => {
    switch (activeTab) {
      case 'crystals':
        return entry.crystals;
      case 'games':
        return entry.games;
      case 'gifts':
        return entry.gifts;
      default:
        return 0;
    }
  };

  const formatValue = (value: number): string => {
    return value.toLocaleString();
  };

  const displayName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'User';
  const isPremium = user?.is_premium;

  const myValue = activeTab === 'crystals' ? crystals : activeTab === 'games' ? gamesPlayed : gifts.length;

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
        {getSortedLeaderboard().map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
            {/* Avatar */}
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0",
              getAvatarColor(entry.id)
            )}>
              {entry.avatar ? (
                <img src={entry.avatar} alt={entry.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                entry.name.charAt(0)
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-sm">{entry.country}</span>
                <span className="font-semibold text-sm truncate">{entry.name}</span>
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
        ))}

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
          <span className="text-base font-bold text-muted-foreground">#999+</span>
        </div>
      </div>
    </div>
  );
};
