import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CrystalIcon } from '@/components/CrystalIcon';
import { Prize } from '@/store/gameStore';
import { useConfetti } from '@/hooks/useConfetti';
import { cn } from '@/lib/utils';

interface WinModalProps {
  isOpen: boolean;
  onClose: () => void;
  prize: Prize | null;
}

export const WinModal = ({ isOpen, onClose, prize }: WinModalProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const { fireBurst, fireStars } = useConfetti();

  useEffect(() => {
    if (isOpen && prize) {
      setIsAnimating(true);
      
      // Trigger confetti based on prize value
      if (prize.value >= 100) {
        fireBurst();
        setTimeout(() => fireStars(), 300);
      } else {
        fireBurst();
      }
    } else {
      setIsAnimating(false);
    }
  }, [isOpen, prize, fireBurst, fireStars]);

  if (!isOpen || !prize) return null;

  const isJackpot = prize.value >= 200;
  const isBigWin = prize.value >= 100;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />
      
      {/* Modal */}
      <div 
        className={cn(
          "relative bg-card rounded-3xl p-6 w-full max-w-sm shadow-2xl",
          "animate-bounce-in"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center pt-4">
          {/* Win badge */}
          <div className={cn(
            "px-4 py-1.5 rounded-full text-sm font-bold mb-4",
            isJackpot 
              ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-pulse" 
              : isBigWin 
              ? "bg-gradient-to-r from-primary to-blue-400 text-white"
              : "bg-primary/20 text-primary"
          )}>
            {isJackpot ? '🎉 JACKPOT!' : isBigWin ? '🏆 BIG WIN!' : '✨ YOU WON!'}
          </div>

          {/* Prize emoji with animation */}
          <div className={cn(
            "text-8xl mb-4",
            isAnimating && "animate-bounce"
          )}>
            {prize.emoji}
          </div>

          {/* Prize name */}
          <h2 className="text-2xl font-bold mb-2">{prize.name}</h2>

          {/* Prize value */}
          <div className={cn(
            "flex items-center gap-2 text-3xl font-bold mb-6",
            isJackpot ? "text-yellow-400" : "text-primary"
          )}>
            <span>+{prize.value}</span>
            <CrystalIcon size={32} />
          </div>

          {/* Glow effect for big wins */}
          {isBigWin && (
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-primary/20 to-transparent pointer-events-none" />
          )}

          {/* Claim button */}
          <button
            onClick={onClose}
            className={cn(
              "w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-200 active:scale-[0.98]",
              isJackpot 
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-orange-500/30"
                : "bg-primary text-primary-foreground"
            )}
          >
            Awesome! 🎊
          </button>
        </div>

        {/* Decorative sparkles */}
        <div className="absolute -top-2 -left-2 text-2xl animate-pulse">✨</div>
        <div className="absolute -top-2 -right-2 text-2xl animate-pulse delay-100">⭐</div>
        <div className="absolute -bottom-2 -left-2 text-2xl animate-pulse delay-200">🌟</div>
        <div className="absolute -bottom-2 -right-2 text-2xl animate-pulse delay-300">💫</div>
      </div>
    </div>
  );
};
