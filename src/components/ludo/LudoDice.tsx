import { cn } from '@/lib/utils';

interface LudoDiceProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
}

// Dice face dot patterns
const DICE_PATTERNS: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

export const LudoDice = ({ value, isRolling, canRoll, onRoll }: LudoDiceProps) => {
  const displayValue = value || 1;
  const dots = DICE_PATTERNS[displayValue] || DICE_PATTERNS[1];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 3D Dice */}
      <button
        onClick={onRoll}
        disabled={!canRoll}
        className={cn(
          "relative w-20 h-20 perspective-500 transition-all duration-200",
          canRoll && "cursor-pointer hover:scale-105 active:scale-95",
          !canRoll && "cursor-not-allowed opacity-60"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br from-white to-gray-100 rounded-2xl shadow-xl",
            "border-4 border-gray-200 transform-gpu",
            isRolling && "animate-bounce"
          )}
          style={{
            transform: isRolling 
              ? `rotateX(${Math.random() * 360}deg) rotateY(${Math.random() * 360}deg)` 
              : 'rotateX(-10deg) rotateY(10deg)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 -5px 10px rgba(0,0,0,0.1)',
          }}
        >
          {/* Dice Face Grid */}
          <div className="absolute inset-3 grid grid-cols-3 grid-rows-3 gap-1">
            {[0, 1, 2].map((row) =>
              [0, 1, 2].map((col) => {
                const hasDot = dots.some(([r, c]) => r === row && c === col);
                return (
                  <div
                    key={`${row}-${col}`}
                    className="flex items-center justify-center"
                  >
                    {hasDot && (
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full bg-gradient-to-br shadow-inner",
                          "from-gray-700 to-gray-900"
                        )}
                        style={{
                          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.3)',
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Dice Shadow */}
        <div 
          className={cn(
            "absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/20 rounded-full blur-md",
            isRolling && "animate-pulse"
          )}
        />
      </button>

      {/* Roll Button */}
      <button
        onClick={onRoll}
        disabled={!canRoll}
        className={cn(
          "px-8 py-3 rounded-xl font-bold text-lg transition-all duration-300",
          "relative overflow-hidden",
          canRoll
            ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 active:scale-95"
            : "bg-muted text-muted-foreground"
        )}
      >
        <span className="relative z-10">
          {isRolling ? '🎲 Rolling...' : canRoll ? '🎲 Roll Dice' : 'Wait...'}
        </span>
        {canRoll && !isRolling && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        )}
      </button>

      {/* Result Display */}
      {value !== null && !isRolling && (
        <div className="flex items-center gap-2 px-4 py-2 bg-card/60 rounded-full border border-border/50">
          <span className="text-muted-foreground text-sm">Rolled:</span>
          <span className={cn(
            "text-xl font-bold",
            value === 6 ? "text-primary" : "text-foreground"
          )}>
            {value}
          </span>
          {value === 6 && <span className="text-sm">🎉</span>}
        </div>
      )}
    </div>
  );
};
