import { cn } from '@/lib/utils';
import type { PvPGame } from '@/hooks/usePvPGames';

interface PvPGameCardProps {
  game: PvPGame;
  onClick: () => void;
  index: number;
}

export const PvPGameCard = ({ game, onClick, index }: PvPGameCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl",
        "bg-card/40 backdrop-blur-xl border border-border/50",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:border-primary/50",
        "active:scale-[0.98]",
        "group",
        "animate-fade-in"
      )}
      style={{
        animationDelay: `${index * 100}ms`,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset'
      }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      {/* Game Image/Icon Section */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
        {game.image_url ? (
          <img 
            src={game.image_url} 
            alt={game.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <span className="text-6xl transition-transform duration-300 group-hover:scale-110">
            {game.icon_emoji}
          </span>
        )}
        
        {/* Shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            style={{
              transform: 'translateX(-100%)',
              animation: 'shine 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Game Info */}
      <div className="p-4 text-left">
        <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
          {game.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {game.subtitle}
        </p>
      </div>

      {/* Play indicator */}
      <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        <svg 
          className="w-4 h-4 text-primary" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>

      <style>{`
        @keyframes shine {
          0% { transform: translateX(-100%); }
          50%, 100% { transform: translateX(100%); }
        }
      `}</style>
    </button>
  );
};
