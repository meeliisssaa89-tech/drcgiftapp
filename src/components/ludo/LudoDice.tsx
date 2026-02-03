import { cn } from '@/lib/utils';

interface LudoDiceProps {
  value: number | null;
  isRolling: boolean;
  isMyTurn: boolean;
  canRoll: boolean;
  onRoll: () => void;
}

const DiceFace = ({ value }: { value: number }) => {
  const dotPositions: Record<number, string[]> = {
    1: ['center'],
    2: ['top-right', 'bottom-left'],
    3: ['top-right', 'center', 'bottom-left'],
    4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
    6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
  };

  const positionClasses: Record<string, string> = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'middle-left': 'top-1/2 left-2 -translate-y-1/2',
    'middle-right': 'top-1/2 right-2 -translate-y-1/2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };

  return (
    <div className="relative w-16 h-16 bg-white rounded-xl shadow-lg">
      {dotPositions[value]?.map((pos, idx) => (
        <div
          key={idx}
          className={cn(
            "absolute w-3 h-3 rounded-full bg-gray-900",
            positionClasses[pos]
          )}
        />
      ))}
    </div>
  );
};

export const LudoDice = ({ value, isRolling, isMyTurn, canRoll, onRoll }: LudoDiceProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={cn(
          "relative transition-transform duration-100",
          isRolling && "animate-bounce"
        )}
      >
        {value ? (
          <DiceFace value={value} />
        ) : (
          <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl shadow-lg flex items-center justify-center">
            <span className="text-2xl">🎲</span>
          </div>
        )}
        
        {/* Rolling animation overlay */}
        {isRolling && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <button
        onClick={onRoll}
        disabled={!canRoll || isRolling}
        className={cn(
          "px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300",
          "bg-gradient-to-r from-primary to-primary/80",
          "shadow-lg shadow-primary/25",
          canRoll && !isRolling
            ? "hover:scale-105 hover:shadow-xl hover:shadow-primary/30 active:scale-95"
            : "opacity-50 cursor-not-allowed"
        )}
      >
        {isRolling ? 'Rolling...' : isMyTurn ? 'Roll Dice' : "Opponent's Turn"}
      </button>

      {value && !isRolling && (
        <p className="text-sm text-muted-foreground animate-fade-in">
          {value === 6 ? '🎉 Six! Roll again after moving' : `Select a token to move ${value} spaces`}
        </p>
      )}
    </div>
  );
};
