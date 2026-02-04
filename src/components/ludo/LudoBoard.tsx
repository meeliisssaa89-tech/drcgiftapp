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

// Home base positions for 4 tokens (2x2 grid within each base)
const HOME_TOKEN_POSITIONS = [
  { row: 0, col: 0 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
];

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
          "absolute w-8 h-8 rounded-full transition-all duration-300",
          "bg-gradient-to-br shadow-lg border-2",
          colors.bg,
          colors.border,
          isSelectable && "animate-pulse ring-2 ring-white/80 scale-110 cursor-pointer",
          isSelected && `ring-4 ring-white scale-125 ${colors.glow} shadow-xl z-20`,
          !isSelectable && "opacity-80 cursor-default"
        )}
        style={{
          top: `${20 + tokenPos.row * 40}%`,
          left: `${20 + tokenPos.col * 40}%`,
        }}
      >
        <div className="absolute inset-1 rounded-full bg-white/30" />
        <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold drop-shadow-md">
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

    // Calculate visual position on the simplified board
    // This is a simplified representation
    const getTokenPosition = (pos: number, playerColor: string) => {
      // Finished tokens
      if (pos === 57) {
        return { top: 50, left: 50 }; // Center
      }
      
      // Home stretch (52-56)
      if (pos >= 52) {
        const homeStep = pos - 51;
        if (playerColor === 'blue') {
          return { top: 50, left: 10 + homeStep * 7 };
        } else {
          return { top: 50, left: 90 - homeStep * 7 };
        }
      }
      
      // Main track - simplified circular representation
      const angle = (pos / 52) * 360;
      const radius = 38;
      const centerX = 50;
      const centerY = 50;
      
      const radians = (angle - 90) * (Math.PI / 180);
      const x = centerX + radius * Math.cos(radians);
      const y = centerY + radius * Math.sin(radians);
      
      return { top: y, left: x };
    };

    const posCoords = getTokenPosition(position, color);

    return (
      <button
        key={`board-${color}-${tokenIndex}`}
        onClick={() => isSelectable && onTokenClick(tokenIndex)}
        disabled={!isSelectable}
        className={cn(
          "absolute w-7 h-7 rounded-full transition-all duration-300 -translate-x-1/2 -translate-y-1/2",
          "bg-gradient-to-br shadow-lg border-2 z-10",
          colors.bg,
          colors.border,
          isSelectable && "animate-pulse ring-2 ring-white/80 scale-110 cursor-pointer z-20",
          isSelected && `ring-4 ring-white scale-125 ${colors.glow} shadow-xl z-30`,
          !isSelectable && "opacity-90 cursor-default"
        )}
        style={{
          top: `${posCoords.top}%`,
          left: `${posCoords.left}%`,
        }}
      >
        <div className="absolute inset-1 rounded-full bg-white/30" />
        <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow-md">
          {tokenIndex + 1}
        </span>
      </button>
    );
  };

  // Count tokens in each base
  const blueHomeCount = player1Tokens.filter(p => p === -1).length;
  const redHomeCount = player2Tokens.filter(p => p === -1).length;

  return (
    <div className="relative w-full aspect-square max-w-[380px] mx-auto">
      {/* Board Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/80 dark:to-amber-950 rounded-2xl border-4 border-amber-600/50 shadow-2xl overflow-hidden">
        
        {/* Track Circle */}
        <div className="absolute inset-[12%] rounded-full border-4 border-amber-600/30" />
        <div className="absolute inset-[18%] rounded-full border-2 border-amber-600/20" />
        
        {/* Center Area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20">
          <div className="absolute inset-0 rotate-45 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg" />
          <div className="absolute inset-2 rotate-45 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-lg" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🏠</span>
          </div>
        </div>

        {/* Blue Home Base (Bottom Left) */}
        <div className="absolute bottom-3 left-3 w-24 h-24 bg-gradient-to-br from-blue-500/80 to-blue-700/80 rounded-2xl border-3 border-blue-400/60 shadow-lg backdrop-blur-sm">
          <div className="absolute top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-600 rounded-full">
            <span className="text-[10px] font-bold text-white">BLUE</span>
          </div>
          {/* Render 4 home tokens */}
          {[0, 1, 2, 3].map((idx) => renderHomeToken(idx, player1Color, true))}
          {/* Token count */}
          <div className="absolute bottom-1 right-1 text-[10px] text-blue-200 font-medium">
            {blueHomeCount}/4
          </div>
        </div>

        {/* Red Home Base (Top Right) */}
        <div className="absolute top-3 right-3 w-24 h-24 bg-gradient-to-br from-red-500/80 to-red-700/80 rounded-2xl border-3 border-red-400/60 shadow-lg backdrop-blur-sm">
          <div className="absolute top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-600 rounded-full">
            <span className="text-[10px] font-bold text-white">RED</span>
          </div>
          {/* Render 4 home tokens */}
          {[0, 1, 2, 3].map((idx) => renderHomeToken(idx, player2Color, false))}
          {/* Token count */}
          <div className="absolute bottom-1 right-1 text-[10px] text-red-200 font-medium">
            {redHomeCount}/4
          </div>
        </div>

        {/* Home Stretch Indicators */}
        <div className="absolute top-1/2 left-4 right-1/2 h-4 -translate-y-1/2 bg-gradient-to-r from-blue-500/40 to-transparent rounded-l-full mr-12" />
        <div className="absolute top-1/2 right-4 left-1/2 h-4 -translate-y-1/2 bg-gradient-to-l from-red-500/40 to-transparent rounded-r-full ml-12" />

        {/* Start Position Markers */}
        <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-500/60 border-2 border-blue-400 flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">S</span>
        </div>
        <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500/60 border-2 border-red-400 flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">S</span>
        </div>

        {/* Render tokens on board */}
        {[0, 1, 2, 3].map((idx) => renderBoardToken(idx, player1Color, true))}
        {[0, 1, 2, 3].map((idx) => renderBoardToken(idx, player2Color, false))}
      </div>
    </div>
  );
};
