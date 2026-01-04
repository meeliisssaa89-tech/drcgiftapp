import { Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

export const GiveawaysPage = () => {
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

      {/* Coming Soon Card */}
      <div className="card-telegram">
        <div className="text-center py-6">
          <span className="text-5xl mb-3 block">🎁</span>
          <h3 className="text-lg font-semibold mb-1.5">Coming Soon</h3>
          <p className="text-muted-foreground text-sm">
            Stay tuned for exciting giveaways and exclusive prizes!
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-3">
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
