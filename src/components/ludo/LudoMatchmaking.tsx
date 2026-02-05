import { useState } from 'react';
import { Loader2, Sparkles, Trophy, Zap, AlertCircle, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrystalIcon } from '@/components/CrystalIcon';
import { getRankFromWins } from '@/hooks/useLudoGame';

interface LudoMatchmakingProps {
  crystals: number;
  isSearching: boolean;
  onFindGame: (entryFee: number) => void;
  onCancel: () => void;
  matchmakingTimedOut?: boolean;
  myWins?: number;
  player1Profile?: {
    username?: string | null;
    first_name?: string | null;
    avatar_url?: string | null;
  } | null;
  player2Profile?: {
    username?: string | null;
    first_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

const ENTRY_FEE_OPTIONS = [25, 50, 100, 250, 500];

export const LudoMatchmaking = ({
  crystals,
  isSearching,
  onFindGame,
  onCancel,
  matchmakingTimedOut,
  myWins = 0,
  player1Profile,
  player2Profile,
}: LudoMatchmakingProps) => {
  const [selectedFee, setSelectedFee] = useState(50);
  
  const myRank = getRankFromWins(myWins);

  // Get display name
  const getDisplayName = (profile?: { username?: string | null; first_name?: string | null } | null) => {
    if (!profile) return 'Player';
    return profile.username || profile.first_name || 'Player';
  };

  // Get avatar initial
  const getAvatarInitial = (profile?: { username?: string | null; first_name?: string | null } | null) => {
    const name = getDisplayName(profile);
    return name.charAt(0).toUpperCase();
  };

  // Timeout state
  if (matchmakingTimedOut && isSearching) {
    return (
      <div className="flex flex-col items-center gap-6 p-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-foreground">No Opponent Found</h2>
          <p className="text-muted-foreground">
            No players are available for {selectedFee} crystals entry.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
          >
            Cancel & Refund
          </button>
          <button
            onClick={() => onFindGame(selectedFee)}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="flex flex-col items-center gap-8 p-6 animate-fade-in">
        {/* VS Screen */}
        <div className="w-full">
          <h2 className="text-center text-xl font-bold text-foreground mb-6">
            Finding Opponent...
          </h2>
          
          <div className="flex items-center justify-center gap-4">
            {/* Player 1 (You) */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 border-4 border-blue-400/50">
                  {player1Profile?.avatar_url ? (
                    <img 
                      src={player1Profile.avatar_url} 
                      alt="You" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {getAvatarInitial(player1Profile)}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-blue-500 rounded-full">
                  <span className="text-xs font-bold text-white">YOU</span>
                </div>
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-foreground block">
                  {getDisplayName(player1Profile)}
                </span>
                <div className={cn("text-xs px-2 py-0.5 rounded-full bg-gradient-to-r text-white mt-1 inline-flex items-center gap-1", myRank.color)}>
                  <span>{myRank.icon}</span>
                  <span>{myRank.label}</span>
                </div>
              </div>
            </div>

            {/* VS Badge */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
                  <span className="text-2xl font-black text-primary-foreground">VS</span>
                </div>
                <Zap className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-bounce" />
              </div>
              <div className="mt-2 flex items-center gap-1 px-3 py-1 bg-primary/20 rounded-full">
                <CrystalIcon className="w-4 h-4" />
                <span className="text-sm font-bold text-primary">{selectedFee}</span>
              </div>
            </div>

            {/* Player 2 (Searching) */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center shadow-lg border-4 border-muted-foreground/20">
                  {player2Profile ? (
                    player2Profile.avatar_url ? (
                      <img 
                        src={player2Profile.avatar_url} 
                        alt="Opponent" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-foreground">
                        {getAvatarInitial(player2Profile)}
                      </span>
                    )
                  ) : (
                    <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                  )}
                </div>
                {player2Profile && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-500 rounded-full">
                    <span className="text-xs font-bold text-white">RIVAL</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {player2Profile ? getDisplayName(player2Profile) : 'Searching...'}
              </span>
            </div>
          </div>

          {/* Prize Pool */}
          <div className="mt-8 p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/30 text-center">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-muted-foreground">Prize Pool</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <CrystalIcon className="w-6 h-6 text-primary" />
              <span className="text-3xl font-bold text-foreground">
                {Math.floor(selectedFee * 2 * 0.95).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Searching indicator */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Looking for players with same entry fee...</span>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="px-8 py-3 rounded-xl bg-destructive/20 text-destructive hover:bg-destructive/30 transition-all font-medium"
        >
          Cancel Search
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-primary">PvP Mode</span>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Ludo Battle</h2>
        <p className="text-muted-foreground">
          Challenge players and win crystals!
        </p>
      </div>

      {/* Player Card with Rank */}
      <div className="w-full p-4 bg-card/60 rounded-2xl border border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
            {player1Profile?.avatar_url ? (
              <img 
                src={player1Profile.avatar_url} 
                alt="You" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {getAvatarInitial(player1Profile)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground">{getDisplayName(player1Profile)}</p>
            <div className={cn("text-xs px-2 py-0.5 rounded-full bg-gradient-to-r text-white mt-1 inline-flex items-center gap-1", myRank.color)}>
              <span>{myRank.icon}</span>
              <span>{myRank.label}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Balance</p>
            <div className="flex items-center gap-1">
              <CrystalIcon className="w-5 h-5" />
              <span className="font-bold text-lg">{crystals.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Entry Fee Selection - Premium Cards */}
      <div className="w-full space-y-3">
        <label className="text-sm text-muted-foreground font-medium">
          Select Entry Fee
        </label>
        <div className="grid grid-cols-5 gap-2">
          {ENTRY_FEE_OPTIONS.map((fee) => {
            const isSelected = selectedFee === fee;
            const canAfford = crystals >= fee;
            
            return (
              <button
                key={fee}
                onClick={() => canAfford && setSelectedFee(fee)}
                disabled={!canAfford}
                className={cn(
                  "relative flex flex-col items-center justify-center py-4 rounded-xl transition-all duration-300",
                  "border-2 overflow-hidden",
                  isSelected
                    ? "bg-gradient-to-br from-primary to-primary/80 border-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                    : canAfford
                    ? "bg-card/60 border-border/50 text-foreground hover:border-primary/50 hover:bg-card"
                    : "bg-muted/30 border-transparent text-muted-foreground opacity-50 cursor-not-allowed"
                )}
              >
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
                )}
                <CrystalIcon className={cn("w-4 h-4 mb-1", isSelected ? "text-primary-foreground" : "text-primary")} />
                <span className="text-lg font-bold">{fee}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prize Info */}
      <div className="w-full p-5 bg-gradient-to-br from-yellow-500/10 via-primary/10 to-purple-500/10 rounded-2xl border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-muted-foreground">Prize Pool</span>
          </div>
          <div className="flex items-center gap-2">
            <CrystalIcon className="w-6 h-6 text-primary" />
            <span className="text-2xl font-bold text-foreground">
              {Math.floor(selectedFee * 2 * 0.95).toLocaleString()}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Winner takes all • 5% platform fee
        </p>
      </div>

      {/* Play Button */}
      <button
        onClick={() => onFindGame(selectedFee)}
        disabled={crystals < selectedFee}
        className={cn(
          "w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300",
          "bg-gradient-to-r from-primary via-primary to-primary/90",
          "text-primary-foreground shadow-xl shadow-primary/30",
          "relative overflow-hidden",
          crystals >= selectedFee
            ? "hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
            : "opacity-50 cursor-not-allowed"
        )}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {crystals < selectedFee ? (
            'Not Enough Crystals'
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Find Opponent
            </>
          )}
        </span>
        {crystals >= selectedFee && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        )}
      </button>

      {/* Rules */}
      <div className="grid grid-cols-3 gap-3 w-full text-center">
        <div className="p-3 bg-card/40 rounded-xl">
          <span className="text-2xl">🎲</span>
          <p className="text-xs text-muted-foreground mt-1">Roll dice</p>
        </div>
        <div className="p-3 bg-card/40 rounded-xl">
          <span className="text-2xl">🏠</span>
          <p className="text-xs text-muted-foreground mt-1">Race home</p>
        </div>
        <div className="p-3 bg-card/40 rounded-xl">
          <span className="text-2xl">⚔️</span>
          <p className="text-xs text-muted-foreground mt-1">Capture foes</p>
        </div>
      </div>
    </div>
  );
};
