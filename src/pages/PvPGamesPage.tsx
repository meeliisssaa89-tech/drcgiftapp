import { useNavigate } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';
import { usePvPGames } from '@/hooks/usePvPGames';
import { PvPGameCard } from '@/components/PvPGameCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useTelegram } from '@/hooks/useTelegram';

export const PvPGamesPage = () => {
  const navigate = useNavigate();
  const { games, isLoading } = usePvPGames();
  const { hapticFeedback } = useTelegram();

  const handleGameClick = (gameUrl: string | null) => {
    hapticFeedback('medium');
    
    if (gameUrl) {
      // For internal routes, use navigation
      if (gameUrl.startsWith('/')) {
        navigate(gameUrl);
      } else if (gameUrl.startsWith('http')) {
        // For external games, open in new tab
        window.open(gameUrl, '_blank');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 mb-2">
          <Gamepad2 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">PvP Games</h1>
        <p className="text-muted-foreground text-sm">
          Compete with players & win crystals
        </p>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-2 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        ) : games.length === 0 ? (
          // Empty state
          <div className="col-span-2 text-center py-12">
            <Gamepad2 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No games available yet</p>
            <p className="text-muted-foreground/60 text-sm mt-1">
              Check back soon for new games!
            </p>
          </div>
        ) : (
          // Games list
          games.map((game, index) => (
            <PvPGameCard
              key={game.id}
              game={game}
              index={index}
              onClick={() => handleGameClick(game.game_url)}
            />
          ))
        )}
      </div>

      {/* Coming Soon Badge */}
      {games.length > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            More games coming soon
          </div>
        </div>
      )}
    </div>
  );
};
