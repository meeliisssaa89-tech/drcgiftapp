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

// Token colors with gradients
const TOKEN_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  blue: {
    bg: 'from-blue-400 to-blue-600',
    border: 'border-blue-300',
    glow: 'shadow-blue-500/50',
  },
  red: {
    bg: 'from-red-400 to-red-600',
    border: 'border-red-300',
    glow: 'shadow-red-500/50',
  },
};

// Home base positions for 4 tokens (2x2 grid)
const HOME_TOKEN_POSITIONS = [
  { row: 0, col: 0 }, // Token 1 - top left
  { row: 0, col: 1 }, // Token 2 - top right
  { row: 1, col: 0 }, // Token 3 - bottom left
  { row: 1, col: 1 }, // Token 4 - bottom right
];

// Classic Ludo board: 15x15 grid
// The board path for each player
const BOARD_PATH_BLUE = [
  // Start at blue exit, go around clockwise
  { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
  { r: 0, c: 7 },
  { r: 0, c: 8 }, { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
  { r: 7, c: 14 },
  { r: 8, c: 14 }, { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
  { r: 14, c: 7 },
  { r: 14, c: 6 }, { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
  { r: 7, c: 0 },
  // Home stretch for blue (entering from left)
  { r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 },
];

// Red starts at position 26 in the shared path
const BOARD_PATH_RED_START = 26;

// Get position on board grid for a token
const getTokenGridPosition = (position: number, color: string): { row: number; col: number } | null => {
  // In home base
  if (position === -1) return null;
  
  // Finished
  if (position === 57) return { row: 7, col: 7 };
  
  // Home stretch (52-56)
  if (position >= 52) {
    const homeStep = position - 51;
    if (color === 'blue') {
      return { row: 7, col: homeStep };
    } else {
      return { row: 7, col: 14 - homeStep };
    }
  }
  
  // Main track
  const pathIndex = position % 52;
  if (pathIndex < BOARD_PATH_BLUE.length) {
    return { row: BOARD_PATH_BLUE[pathIndex].r, col: BOARD_PATH_BLUE[pathIndex].c };
  }
  
  return null;
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
  
  const renderHomeToken = (
    tokenIndex: number,
    color: string,
    isP1: boolean
  ) => {
    const tokens = isP1 ? player1Tokens : player2Tokens;
    const position = tokens[tokenIndex];
    
    // Only render tokens that are in home base (-1)
    if (position !== -1) return null;
    
    const tokenPos = HOME_TOKEN_POSITIONS[tokenIndex];
    const isSelectable = isMyTurn && myColor === color && validMoves.includes(tokenIndex);
    const isSelected = selectedToken === tokenIndex && myColor === color;
    const colors = TOKEN_COLORS[color];

    return (
      <button
        key={`home-${color}-${tokenIndex}`}
        onClick={() => isSelectable && onTokenClick(tokenIndex)}
        disabled={!isSelectable}
        className={cn(
          "absolute w-7 h-7 rounded-full transition-all duration-300",
          "bg-gradient-to-br shadow-lg border-2",
          colors.bg,
          colors.border,
          isSelectable && "animate-pulse ring-2 ring-white/80 scale-110 cursor-pointer",
          isSelected && `ring-4 ring-white scale-125 ${colors.glow} shadow-xl z-20`,
          !isSelectable && "opacity-80 cursor-default"
        )}
        style={{
          top: `${15 + tokenPos.row * 35}%`,
          left: `${15 + tokenPos.col * 35}%`,
        }}
      >
        <div className="absolute inset-1 rounded-full bg-white/30" />
        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow-md">
          {tokenIndex + 1}
        </span>
      </button>
    );
  };

  const renderBoardToken = (
    tokenIndex: number,
    color: string,
    isP1: boolean
  ) => {
    const tokens = isP1 ? player1Tokens : player2Tokens;
    const position = tokens[tokenIndex];
    
    // Only render tokens on the board (0-57, not in home base -1)
    if (position < 0) return null;
    
    const isSelectable = isMyTurn && myColor === color && validMoves.includes(tokenIndex);
    const isSelected = selectedToken === tokenIndex && myColor === color;
    const colors = TOKEN_COLORS[color];

    const gridPos = getTokenGridPosition(position, color);
    if (!gridPos) return null;
    
    // Convert grid position to percentage
    const cellSize = 100 / 15;
    const top = gridPos.row * cellSize + cellSize / 2;
    const left = gridPos.col * cellSize + cellSize / 2;

    return (
      <button
        key={`board-${color}-${tokenIndex}`}
        onClick={() => isSelectable && onTokenClick(tokenIndex)}
        disabled={!isSelectable}
        className={cn(
          "absolute w-5 h-5 rounded-full transition-all duration-300 -translate-x-1/2 -translate-y-1/2",
          "bg-gradient-to-br shadow-lg border-2 z-10",
          colors.bg,
          colors.border,
          isSelectable && "animate-pulse ring-2 ring-white/80 scale-110 cursor-pointer z-20",
          isSelected && `ring-4 ring-white scale-125 ${colors.glow} shadow-xl z-30`,
          !isSelectable && "opacity-90 cursor-default"
        )}
        style={{
          top: `${top}%`,
          left: `${left}%`,
        }}
      >
        <div className="absolute inset-0.5 rounded-full bg-white/30" />
        <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold drop-shadow-md">
          {tokenIndex + 1}
        </span>
      </button>
    );
  };

  // Count tokens in each base
  const blueHomeCount = player1Tokens.filter(p => p === -1).length;
  const redHomeCount = player2Tokens.filter(p => p === -1).length;
  
  const cellSize = 100 / 15;

  return (
    <div className="relative w-full aspect-square max-w-[360px] mx-auto">
      {/* Classic Ludo Board */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-stone-900 rounded-xl border-4 border-amber-700/60 shadow-2xl overflow-hidden">
        
        {/* Grid lines for visual reference */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 15 15" preserveAspectRatio="none">
          {/* Blue home base (top-left 6x6) */}
          <rect x="0" y="0" width="6" height="6" fill="#3b82f6" fillOpacity="0.3" stroke="#3b82f6" strokeWidth="0.1" />
          
          {/* Red home base (bottom-right 6x6) */}
          <rect x="9" y="9" width="6" height="6" fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeWidth="0.1" />
          
          {/* Green home base (top-right 6x6) - unused but for classic look */}
          <rect x="9" y="0" width="6" height="6" fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="0.1" />
          
          {/* Yellow home base (bottom-left 6x6) - unused but for classic look */}
          <rect x="0" y="9" width="6" height="6" fill="#eab308" fillOpacity="0.15" stroke="#eab308" strokeWidth="0.1" />
          
          {/* Center triangles forming winning area */}
          <polygon points="6,6 7.5,7.5 6,9" fill="#3b82f6" fillOpacity="0.5" />
          <polygon points="9,6 7.5,7.5 9,9" fill="#ef4444" fillOpacity="0.5" />
          <polygon points="6,6 7.5,7.5 9,6" fill="#22c55e" fillOpacity="0.3" />
          <polygon points="6,9 7.5,7.5 9,9" fill="#eab308" fillOpacity="0.3" />
          
          {/* Track paths */}
          {/* Vertical blue home stretch */}
          <rect x="6" y="1" width="1" height="5" fill="#3b82f6" fillOpacity="0.4" />
          
          {/* Vertical red home stretch */}
          <rect x="8" y="9" width="1" height="5" fill="#ef4444" fillOpacity="0.4" />
          
          {/* Horizontal paths */}
          <rect x="1" y="6" width="5" height="1" fill="#ffffff" fillOpacity="0.3" />
          <rect x="1" y="7" width="5" height="1" fill="#3b82f6" fillOpacity="0.4" />
          <rect x="1" y="8" width="5" height="1" fill="#ffffff" fillOpacity="0.3" />
          
          <rect x="9" y="6" width="5" height="1" fill="#ffffff" fillOpacity="0.3" />
          <rect x="9" y="7" width="5" height="1" fill="#ef4444" fillOpacity="0.4" />
          <rect x="9" y="8" width="5" height="1" fill="#ffffff" fillOpacity="0.3" />
          
          {/* Vertical paths */}
          <rect x="6" y="1" width="1" height="5" fill="#ffffff" fillOpacity="0.3" />
          <rect x="8" y="1" width="1" height="5" fill="#ffffff" fillOpacity="0.3" />
          <rect x="6" y="9" width="1" height="5" fill="#ffffff" fillOpacity="0.3" />
          <rect x="8" y="9" width="1" height="5" fill="#ffffff" fillOpacity="0.3" />
          
          {/* Top/bottom middle cells */}
          <rect x="7" y="0" width="1" height="1" fill="#22c55e" fillOpacity="0.4" />
          <rect x="7" y="14" width="1" height="1" fill="#eab308" fillOpacity="0.4" />
          
          {/* Start positions (safe spots) */}
          <rect x="1" y="6" width="1" height="1" fill="#3b82f6" fillOpacity="0.6" stroke="#3b82f6" strokeWidth="0.05" />
          <rect x="8" y="13" width="1" height="1" fill="#ef4444" fillOpacity="0.6" stroke="#ef4444" strokeWidth="0.05" />
          
          {/* Safe spots */}
          <circle cx="2.5" cy="6.5" r="0.25" fill="#fbbf24" />
          <circle cx="6.5" cy="2.5" r="0.25" fill="#fbbf24" />
          <circle cx="8.5" cy="2.5" r="0.25" fill="#fbbf24" />
          <circle cx="12.5" cy="6.5" r="0.25" fill="#fbbf24" />
          <circle cx="12.5" cy="8.5" r="0.25" fill="#fbbf24" />
          <circle cx="8.5" cy="12.5" r="0.25" fill="#fbbf24" />
          <circle cx="6.5" cy="12.5" r="0.25" fill="#fbbf24" />
          <circle cx="2.5" cy="8.5" r="0.25" fill="#fbbf24" />
        </svg>
        
        {/* Center Area */}
        <div 
          className="absolute flex items-center justify-center"
          style={{
            top: `${6 * cellSize}%`,
            left: `${6 * cellSize}%`,
            width: `${3 * cellSize}%`,
            height: `${3 * cellSize}%`,
          }}
        >
          <span className="text-xl">🏠</span>
        </div>

        {/* Blue Home Base with 4 tokens */}
        <div 
          className="absolute bg-gradient-to-br from-blue-500/90 to-blue-700/90 rounded-lg border-2 border-blue-400/60 shadow-lg"
          style={{
            top: `${0.5 * cellSize}%`,
            left: `${0.5 * cellSize}%`,
            width: `${5 * cellSize}%`,
            height: `${5 * cellSize}%`,
          }}
        >
          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-blue-600 rounded-full">
            <span className="text-[8px] font-bold text-white">BLUE</span>
          </div>
          <div className="absolute inset-2 bg-blue-900/40 rounded-md flex items-center justify-center">
            <div className="relative w-full h-full">
              {[0, 1, 2, 3].map((idx) => renderHomeToken(idx, player1Color, true))}
            </div>
          </div>
          <div className="absolute bottom-0.5 right-1 text-[8px] text-blue-200 font-medium">
            {blueHomeCount}/4
          </div>
        </div>

        {/* Red Home Base with 4 tokens */}
        <div 
          className="absolute bg-gradient-to-br from-red-500/90 to-red-700/90 rounded-lg border-2 border-red-400/60 shadow-lg"
          style={{
            top: `${9.5 * cellSize}%`,
            left: `${9.5 * cellSize}%`,
            width: `${5 * cellSize}%`,
            height: `${5 * cellSize}%`,
          }}
        >
          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-red-600 rounded-full">
            <span className="text-[8px] font-bold text-white">RED</span>
          </div>
          <div className="absolute inset-2 bg-red-900/40 rounded-md flex items-center justify-center">
            <div className="relative w-full h-full">
              {[0, 1, 2, 3].map((idx) => renderHomeToken(idx, player2Color, false))}
            </div>
          </div>
          <div className="absolute bottom-0.5 right-1 text-[8px] text-red-200 font-medium">
            {redHomeCount}/4
          </div>
        </div>

        {/* Render tokens on board */}
        {[0, 1, 2, 3].map((idx) => renderBoardToken(idx, player1Color, true))}
        {[0, 1, 2, 3].map((idx) => renderBoardToken(idx, player2Color, false))}
      </div>
    </div>
  );
};
