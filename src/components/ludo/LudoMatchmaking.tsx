import { useState } from 'react';
import { Loader2, Users, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrystalIcon } from '@/components/CrystalIcon';

interface LudoMatchmakingProps {
  crystals: number;
  isSearching: boolean;
  onFindGame: (entryFee: number) => void;
  onCancel: () => void;
}

const ENTRY_FEE_OPTIONS = [50, 100, 250, 500, 1000];

export const LudoMatchmaking = ({
  crystals,
  isSearching,
  onFindGame,
  onCancel,
}: LudoMatchmakingProps) => {
  const [selectedFee, setSelectedFee] = useState(100);

  return (
    <div className="flex flex-col items-center gap-6 p-6 animate-fade-in">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Ludo PvP</h2>
        <p className="text-muted-foreground">
          Challenge players and win crystals!
        </p>
      </div>

      {/* Balance */}
      <div className="flex items-center gap-2 px-4 py-2 bg-card/60 rounded-full border border-border/50">
        <CrystalIcon className="w-5 h-5" />
        <span className="font-semibold">{crystals.toLocaleString()}</span>
      </div>

      {isSearching ? (
        /* Searching State */
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-primary/30 flex items-center justify-center">
              <Users className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <Loader2 className="absolute -top-1 -right-1 w-8 h-8 text-primary animate-spin" />
          </div>
          <p className="text-foreground font-medium">Finding opponent...</p>
          <p className="text-sm text-muted-foreground">
            Entry fee: {selectedFee} crystals
          </p>
          <button
            onClick={onCancel}
            className="mt-4 px-6 py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        /* Entry Fee Selection */
        <>
          <div className="w-full space-y-3">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Select Entry Fee
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ENTRY_FEE_OPTIONS.map((fee) => (
                <button
                  key={fee}
                  onClick={() => setSelectedFee(fee)}
                  disabled={crystals < fee}
                  className={cn(
                    "py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    "border",
                    selectedFee === fee
                      ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                      : crystals >= fee
                      ? "bg-card/60 text-foreground border-border/50 hover:border-primary/50"
                      : "bg-muted/30 text-muted-foreground border-transparent opacity-50 cursor-not-allowed"
                  )}
                >
                  {fee}
                </button>
              ))}
            </div>
          </div>

          {/* Prize Info */}
          <div className="w-full p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prize Pool</span>
              <div className="flex items-center gap-2">
                <CrystalIcon className="w-5 h-5 text-primary" />
                <span className="text-xl font-bold text-foreground">
                  {(selectedFee * 2 * 0.95).toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Winner takes all (5% platform fee)
            </p>
          </div>

          {/* Play Button */}
          <button
            onClick={() => onFindGame(selectedFee)}
            disabled={crystals < selectedFee}
            className={cn(
              "w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300",
              "bg-gradient-to-r from-primary to-primary/80",
              "text-primary-foreground shadow-lg shadow-primary/25",
              crystals >= selectedFee
                ? "hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
                : "opacity-50 cursor-not-allowed"
            )}
          >
            {crystals < selectedFee ? 'Not enough crystals' : 'Find Opponent'}
          </button>

          {/* Rules */}
          <div className="text-center text-xs text-muted-foreground space-y-1">
            <p>🎲 Roll dice to move your tokens</p>
            <p>🏠 Get all 4 tokens home to win</p>
            <p>⚔️ Land on opponent to capture</p>
          </div>
        </>
      )}
    </div>
  );
};
