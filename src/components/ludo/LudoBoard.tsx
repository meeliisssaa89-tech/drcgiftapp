import { cn } from '@/lib/utils';
import ludoBoardImage from '@/assets/ludo-board.jpg';

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

// Token visual styles for all 4 colors
const TOKEN_STYLES: Record<string, { bg: string; border: string; glow: string; shadow: string }> = {
  red: {
    bg: 'bg-red-600',
    border: 'border-red-300',
    glow: 'shadow-red-500/60',
    shadow: 'drop-shadow-[0_2px_4px_rgba(239,68,68,0.5)]',
  },
  green: {
    bg: 'bg-green-600',
    border: 'border-green-300',
    glow: 'shadow-green-500/60',
    shadow: 'drop-shadow-[0_2px_4px_rgba(34,197,94,0.5)]',
  },
  blue: {
    bg: 'bg-blue-500',
    border: 'border-blue-300',
    glow: 'shadow-blue-500/60',
    shadow: 'drop-shadow-[0_2px_4px_rgba(59,130,246,0.5)]',
  },
  yellow: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-300',
    glow: 'shadow-yellow-500/60',
    shadow: 'drop-shadow-[0_2px_4px_rgba(234,179,8,0.5)]',
  },
};

// Home base token positions (percentage offsets within the home quadrant)
// Each home quadrant is roughly 40% of the board, tokens arranged in 2x2
const HOME_POSITIONS: Record<string, { x: number; y: number }[]> = {
  red: [
    { x: 10.5, y: 10.5 },
    { x: 24, y: 10.5 },
    { x: 10.5, y: 24 },
    { x: 24, y: 24 },
  ],
  green: [
    { x: 70, y: 10.5 },
    { x: 83.5, y: 10.5 },
    { x: 70, y: 24 },
    { x: 83.5, y: 24 },
  ],
  blue: [
    { x: 10.5, y: 70 },
    { x: 24, y: 70 },
    { x: 10.5, y: 83.5 },
    { x: 24, y: 83.5 },
  ],
  yellow: [
    { x: 70, y: 70 },
    { x: 83.5, y: 70 },
    { x: 70, y: 83.5 },
    { x: 83.5, y: 83.5 },
  ],
};

// 15x15 grid cell positions as percentages
// The board image maps to a 15x15 grid, each cell is ~6.67%
const CELL_PCT = 100 / 15;
const cellCenter = (idx: number) => idx * CELL_PCT + CELL_PCT / 2;

// Full 52-cell shared path around the board (clockwise starting from blue's exit)
// Index 0 = blue start, 13 = red start, 26 = green start (adjusted for 2-player), etc.
const SHARED_PATH: { r: number; c: number }[] = [
  // Blue exit going up (column 6, rows 6→0)
  { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
  // Up column 6
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
  // Top middle
  { r: 0, c: 7 },
  // Down column 8
  { r: 0, c: 8 }, { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
  // Right row 6
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
  // Right middle
  { r: 7, c: 14 },
  // Left row 8
  { r: 8, c: 14 }, { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
  // Down column 8
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
  // Bottom middle
  { r: 14, c: 7 },
  // Up column 6
  { r: 14, c: 6 }, { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
  // Left row 8
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
  // Left middle
  { r: 7, c: 0 },
];

// Home stretch paths (the colored lanes leading to center)
const HOME_STRETCH: Record<string, { r: number; c: number }[]> = {
  blue: [
    { r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 },
  ],
  red: [
    { r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }, { r: 6, c: 7 },
  ],
  green: [
    { r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }, { r: 7, c: 8 },
  ],
  yellow: [
    { r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }, { r: 8, c: 7 },
  ],
};

// Get grid position for a token based on its numeric position and color
const getTokenGridPosition = (position: number, color: string): { x: number; y: number } | null => {
  if (position === -1) return null; // in home base
  if (position === 57) return { x: cellCenter(7), y: cellCenter(7) }; // center/finished

  // Home stretch (positions 52–56)
  if (position >= 52) {
    const step = position - 52;
    const stretch = HOME_STRETCH[color];
    if (stretch && step < stretch.length) {
      return { x: cellCenter(stretch[step].c), y: cellCenter(stretch[step].r) };
    }
    return { x: cellCenter(7), y: cellCenter(7) };
  }

  // Main track
  const pathIndex = position % 52;
  if (pathIndex < SHARED_PATH.length) {
    const cell = SHARED_PATH[pathIndex];
    return { x: cellCenter(cell.c), y: cellCenter(cell.r) };
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

  const renderToken = (
    tokenIndex: number,
    color: string,
    isP1: boolean,
    isOnBoard: boolean
  ) => {
    const tokens = isP1 ? player1Tokens : player2Tokens;
    const position = tokens[tokenIndex];
    const styles = TOKEN_STYLES[color] || TOKEN_STYLES.blue;
    const isSelectable = isMyTurn && myColor === color && validMoves.includes(tokenIndex);
    const isSelected = selectedToken === tokenIndex && myColor === color;

    if (isOnBoard) {
      // Token on the board track
      if (position < 0) return null;
      const pos = getTokenGridPosition(position, color);
      if (!pos) return null;

      return (
        <button
          key={`board-${color}-${tokenIndex}`}
          onClick={() => isSelectable && onTokenClick(tokenIndex)}
          disabled={!isSelectable}
          className={cn(
            "absolute w-[7%] h-[7%] rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
            "border-2 z-10 flex items-center justify-center",
            styles.bg, styles.border, styles.shadow,
            isSelectable && "animate-pulse ring-2 ring-white/90 scale-110 cursor-pointer z-20",
            isSelected && `ring-[3px] ring-white scale-125 ${styles.glow} shadow-xl z-30`,
            !isSelectable && "cursor-default"
          )}
          style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
        >
          <div className="absolute inset-[2px] rounded-full bg-white/30" />
          <span className="relative text-white text-[9px] font-bold drop-shadow-md">
            {tokenIndex + 1}
          </span>
        </button>
      );
    } else {
      // Token in home base
      if (position !== -1) return null;
      const homePos = HOME_POSITIONS[color];
      if (!homePos) return null;
      const hp = homePos[tokenIndex];

      return (
        <button
          key={`home-${color}-${tokenIndex}`}
          onClick={() => isSelectable && onTokenClick(tokenIndex)}
          disabled={!isSelectable}
          className={cn(
            "absolute w-[8%] h-[8%] rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300",
            "border-2 z-10 flex items-center justify-center",
            styles.bg, styles.border, styles.shadow,
            isSelectable && "animate-pulse ring-2 ring-white/90 scale-110 cursor-pointer z-20",
            isSelected && `ring-[3px] ring-white scale-125 ${styles.glow} shadow-xl z-30`,
            !isSelectable && "cursor-default"
          )}
          style={{ top: `${hp.y}%`, left: `${hp.x}%` }}
        >
          <div className="absolute inset-[2px] rounded-full bg-white/30" />
          <span className="relative text-white text-[10px] font-bold drop-shadow-md">
            {tokenIndex + 1}
          </span>
        </button>
      );
    }
  };

  return (
    <div className="relative w-full aspect-square max-w-[360px] mx-auto">
      {/* Board image background */}
      <img
        src={ludoBoardImage}
        alt="Ludo Board"
        className="absolute inset-0 w-full h-full rounded-xl shadow-2xl"
        draggable={false}
      />

      {/* Home base tokens */}
      {[0, 1, 2, 3].map((idx) => renderToken(idx, player1Color, true, false))}
      {[0, 1, 2, 3].map((idx) => renderToken(idx, player2Color, false, false))}

      {/* Board track tokens */}
      {[0, 1, 2, 3].map((idx) => renderToken(idx, player1Color, true, true))}
      {[0, 1, 2, 3].map((idx) => renderToken(idx, player2Color, false, true))}
    </div>
  );
};
