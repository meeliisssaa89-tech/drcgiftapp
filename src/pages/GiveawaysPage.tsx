import { Gift, Users, Calendar, Loader2, Trophy, Clock } from 'lucide-react';
import { useGameData } from '@/hooks/useGameData';
import { useGiveawayParticipation } from '@/hooks/useGiveawayParticipation';
import { CrystalBadge } from '@/components/CrystalIcon';
import { cn } from '@/lib/utils';

const formatTimeRemaining = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const GiveawaysPage = () => {
  const { giveaways, isLoading: giveawaysLoading } = useGameData();
  const { isParticipating, joinGiveaway, isLoading: participationLoading } = useGiveawayParticipation();

  const isLoading = giveawaysLoading || participationLoading;

  const activeGiveaways = giveaways.filter((g) => {
    const now = new Date();
    const end = new Date(g.end_at);
    return end > now && g.is_active;
  });

  const endedGiveaways = giveaways.filter((g) => {
    const now = new Date();
    const end = new Date(g.end_at);
    return end <= now || !g.is_active;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading giveaways...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col items-center py-6">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-3">
          <Gift className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold">Giveaways</h1>
        <p className="text-muted-foreground mt-1.5 text-sm text-center">
          Participate in giveaways and win amazing prizes!
        </p>
      </div>

      {/* Active Giveaways */}
      {activeGiveaways.length > 0 ? (
        <div className="space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Active Giveaways
          </h2>

          {activeGiveaways.map((giveaway) => {
            const participating = isParticipating(giveaway.id);
            const progress = giveaway.max_participants 
              ? (giveaway.current_participants / giveaway.max_participants) * 100 
              : 0;

            return (
              <div key={giveaway.id} className="card-telegram overflow-hidden">
                {/* Status badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{giveaway.emoji}</span>
                  <div className="flex items-center gap-1 text-xs text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    {formatTimeRemaining(giveaway.end_at)}
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-1">{giveaway.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{giveaway.description}</p>

                {/* Prize */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">Prize:</span>
                  <CrystalBadge amount={giveaway.prize_amount} size="sm" />
                  <span className="text-xs text-muted-foreground capitalize">({giveaway.prize_type})</span>
                </div>

                {/* Participants */}
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {giveaway.current_participants}
                    {giveaway.max_participants && ` / ${giveaway.max_participants}`} participants
                  </span>
                </div>

                {/* Progress bar if max participants */}
                {giveaway.max_participants && (
                  <div className="w-full h-2 bg-secondary rounded-full mb-4 overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                )}

                {/* Date range */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(giveaway.start_at)} - {formatDate(giveaway.end_at)}</span>
                </div>

                {/* Action button */}
                <button
                  onClick={() => joinGiveaway(giveaway.id)}
                  disabled={participating}
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold transition-all",
                    participating
                      ? "bg-green-500/20 text-green-500 cursor-default"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  )}
                >
                  {participating ? '✓ Participating' : 'Join Giveaway'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* No Active Giveaways */
        <div className="card-telegram">
          <div className="text-center py-6">
            <span className="text-5xl mb-3 block">🎁</span>
            <h3 className="text-lg font-semibold mb-1.5">No Active Giveaways</h3>
            <p className="text-muted-foreground text-sm">
              Stay tuned for exciting giveaways and exclusive prizes!
            </p>
          </div>
        </div>
      )}

      {/* Ended Giveaways */}
      {endedGiveaways.length > 0 && (
        <div className="space-y-4 mt-6">
          <h2 className="font-bold text-lg text-muted-foreground">Past Giveaways</h2>

          {endedGiveaways.slice(0, 3).map((giveaway) => (
            <div key={giveaway.id} className="card-telegram opacity-60">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{giveaway.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{giveaway.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {giveaway.current_participants} participants
                  </p>
                </div>
                <CrystalBadge amount={giveaway.prize_amount} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-card rounded-xl text-center py-4 px-3">
          <span className="text-2xl mb-1.5 block">🎯</span>
          <span className="text-xs text-muted-foreground">Weekly Draws</span>
        </div>
        <div className="bg-card rounded-xl text-center py-4 px-3">
          <span className="text-2xl mb-1.5 block">💎</span>
          <span className="text-xs text-muted-foreground">Crystal Prizes</span>
        </div>
        <div className="bg-card rounded-xl text-center py-4 px-3">
          <span className="text-2xl mb-1.5 block">🏆</span>
          <span className="text-xs text-muted-foreground">Top Rewards</span>
        </div>
        <div className="bg-card rounded-xl text-center py-4 px-3">
          <span className="text-2xl mb-1.5 block">🎪</span>
          <span className="text-xs text-muted-foreground">Special Events</span>
        </div>
      </div>
    </div>
  );
};
