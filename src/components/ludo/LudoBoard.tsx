import { cn } from '@/lib/utils';

interface LudoBoardProps {
  player1Tokens: number[];
  player2Tokens: number[];
  player1Color: string;
  player2Color: string;
  validMoves: number[];
  selectedToken: number | null;
  isMyTurn: boolean;
  myColor: string | undefined;
  onTokenClick: (tokenIndex: number) => void;
}

// Board cell positions - maps position numbers to grid coordinates
const CELL_POSITIONS: Record<number, { row: number; col: number }> = {};

// Generate main track positions (simplified 2-player board)
// The board is 15x15 grid
// Blue starts bottom, Red starts top
const generatePositions = () => {
  // Main track - goes around the outside
  // Bottom row (left to right) - positions 0-6
  for (let i = 0; i <= 6; i++) {
    CELL_POSITIONS[i] = { row: 13, col: 6 + i };
  }
  // Right column (bottom to top) - positions 7-12
  for (let i = 0; i <= 5; i++) {
    CELL_POSITIONS[7 + i] = { row: 12 - i, col: 13 };
  }
  // Top right corner - position 13
  CELL_POSITIONS[13] = { row: 6, col: 13 };
  // Top row (right to left) - positions 14-20
  for (let i = 0; i <= 6; i++) {
    CELL_POSITIONS[14 + i] = { row: 6, col: 12 - i };
  }
  // Left column going down at top
  for (let i = 0; i <= 5; i++) {
    CELL_POSITIONS[21 + i] = { row: 7 + i, col: 6 };
  }
  // Red start area - position 26
  CELL_POSITIONS[26] = { row: 1, col: 7 };
  // Continue track...
  // Top row left side
  for (let i = 0; i <= 5; i++) {
    CELL_POSITIONS[27 + i] = { row: 1, col: 6 - i };
  }
  // Left column (top to bottom)
  for (let i = 0; i <= 5; i++) {
    CELL_POSITIONS[33 + i] = { row: 2 + i, col: 1 };
  }
  // Bottom left corner
  CELL_POSITIONS[39] = { row: 8, col: 1 };
  // Bottom row (left to right)
  for (let i = 0; i <= 5; i++) {
    CELL_POSITIONS[40 + i] = { row: 8, col: 2 + i };
  }
  // Center column going up
  for (let i = 0; i <= 5; i++) {
    CELL_POSITIONS[46 + i] = { row: 7 - i, col: 7 };
  }
  // Continue around
  for (let i = 0; i <= 3; i++) {
    CELL_POSITIONS[52 + i] = { row: 14 - i, col: 7 };
  }
};

generatePositions();

// Token colors with gradients
const TOKEN_COLORS: Record<string, string> = {
  blue: 'from-blue-400 to-blue-600',
  red: 'from-red-400 to-red-600',
};

const TOKEN_GLOW: Record<string, string> = {
  blue: 'shadow-blue-500/50',
  red: 'shadow-red-500/50',
};

export const LudoBoard = ({
  player1Tokens,
  player2Tokens,
  player1Color,
  player2Color,
  validMoves,
  selectedToken,
  isMyTurn,
  myColor,
  onTokenClick,
}: LudoBoardProps) => {
  const renderToken = (
    position: number,
    color: string,
    tokenIndex: number,
    isPlayer1: boolean
  ) => {
    const isSelectable = isMyTurn && myColor === color && validMoves.includes(tokenIndex);
    const isSelected = selectedToken === tokenIndex && myColor === color;

    // Token in home base
    if (position === -1) {
      return null; // Render in home base area instead
    }

    const cellPos = CELL_POSITIONS[position];
    if (!cellPos) return null;

    return (
      <div
        key={`${color}-${tokenIndex}`}
        className={cn(
          "absolute w-6 h-6 rounded-full cursor-pointer transition-all duration-300",
          "bg-gradient-to-br shadow-lg",
          TOKEN_COLORS[color],
          isSelectable && "animate-pulse ring-2 ring-white ring-opacity-75",
          isSelected && `ring-4 ring-white scale-125 ${TOKEN_GLOW[color]} shadow-xl`,
          !isSelectable && !isSelected && "opacity-90"
        )}
        style={{
          top: `${(cellPos.row / 15) * 100}%`,
          left: `${(cellPos.col / 15) * 100}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: isSelected ? 20 : 10,
        }}
        onClick={() => isSelectable && onTokenClick(tokenIndex)}
      >
        <div className="absolute inset-1 rounded-full bg-white/20" />
        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
          {tokenIndex + 1}
        </span>
      </div>
    );
  };

  const renderHomeBase = (tokens: number[], color: string, isTop: boolean) => {
    const homeTokens = tokens
      .map((pos, idx) => ({ pos, idx }))
      .filter(t => t.pos === -1);

    return (
      <div
        className={cn(
          "absolute flex flex-wrap gap-2 p-3",
          isTop ? "top-2 right-2" : "bottom-2 left-2"
        )}
      >
        {homeTokens.map(({ idx }) => {
          const isSelectable = isMyTurn && myColor === color && validMoves.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => isSelectable && onTokenClick(idx)}
              className={cn(
                "w-8 h-8 rounded-full bg-gradient-to-br transition-all duration-300",
                TOKEN_COLORS[color],
                "shadow-lg",
                isSelectable && "animate-pulse ring-2 ring-white scale-110",
                !isSelectable && "opacity-60"
              )}
            >
              <span className="text-white text-sm font-bold">{idx + 1}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto">
      {/* Board Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/80 to-amber-950/90 rounded-2xl border-4 border-amber-700/50 shadow-2xl overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="6.67%" height="6.67%" patternUnits="userSpaceOnUse">
                <path
                  d="M 100 0 L 0 0 0 100"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Center Diamond */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rotate-45 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded shadow-lg">
          <div className="absolute inset-2 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded" />
        </div>

        {/* Home Bases */}
        {/* Blue Home (bottom-left) */}
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-blue-900/60 rounded-xl border-2 border-blue-500/50 backdrop-blur-sm">
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-blue-300 text-xs font-semibold">
            Blue
          </div>
        </div>

        {/* Red Home (top-right) */}
        <div className="absolute top-4 right-4 w-24 h-24 bg-red-900/60 rounded-xl border-2 border-red-500/50 backdrop-blur-sm">
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-red-300 text-xs font-semibold">
            Red
          </div>
        </div>

        {/* Track Highlight (simplified visual) */}
        <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 bg-amber-200/10" />
        <div className="absolute top-0 bottom-0 left-1/2 w-8 -translate-x-1/2 bg-amber-200/10" />

        {/* Home Stretches */}
        <div className="absolute top-1/2 left-4 right-1/2 h-6 -translate-y-1/2 bg-blue-500/20 rounded-l-full mr-8" />
        <div className="absolute top-1/2 right-4 left-1/2 h-6 -translate-y-1/2 bg-red-500/20 rounded-r-full ml-8" />

        {/* Render tokens in home bases */}
        {renderHomeBase(player1Tokens, player1Color, false)}
        {renderHomeBase(player2Tokens, player2Color, true)}

        {/* Render tokens on board */}
        {player1Tokens.map((pos, idx) =>
          renderToken(pos, player1Color, idx, true)
        )}
        {player2Tokens.map((pos, idx) =>
          renderToken(pos, player2Color, idx, false)
        )}
      </div>
    </div>
  );
};
