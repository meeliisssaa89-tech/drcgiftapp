import { useState, useRef, useCallback, useEffect } from 'react';
import { CrystalIcon, CrystalBadge } from '@/components/CrystalIcon';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { useGameStore, PRIZES, Prize } from '@/store/gameStore';
import { useTelegram } from '@/hooks/useTelegram';
import { cn } from '@/lib/utils';

const BET_AMOUNTS = [25, 50, 100, 250];

// Spin items for the horizontal carousel
const SPIN_ITEMS = [
  { emoji: '🧸', value: 75, label: 'Teddy' },
  { emoji: '💎', value: 250, label: 'Crystals' },
  { emoji: '🍾', value: 50, label: 'Champagne' },
  { emoji: '🏆', value: 100, label: 'Trophy' },
  { emoji: '💍', value: 100, label: 'Ring' },
  { emoji: '⭐', value: 10, label: 'Star' },
  { emoji: '🌹', value: 25, label: 'Flower' },
];

export const PlayPage = () => {
  const { user } = useTelegram();
  const { 
    crystals, 
    isDemoMode, 
    demoCrystals, 
    level,
    setDemoMode, 
    deductCrystals, 
    addCrystals,
    addGift,
    addHistoryEntry,
    incrementGamesPlayed 
  } = useGameStore();
  const { hapticFeedback } = useTelegram();
  
  const [selectedBet, setSelectedBet] = useState(25);
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentBalance = isDemoMode ? demoCrystals : crystals;
  const displayName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'User';
  const isPremium = user?.is_premium;

  const handleBetSelect = (amount: number) => {
    hapticFeedback('selection');
    setSelectedBet(amount);
  };

  const spinWheel = useCallback(() => {
    if (isSpinning) return;
    
    if (currentBalance < selectedBet) {
      hapticFeedback('error');
      return;
    }

    if (!deductCrystals(selectedBet)) {
      hapticFeedback('error');
      return;
    }

    hapticFeedback('medium');
    setIsSpinning(true);
    incrementGamesPlayed();

    // Animate the horizontal scroll
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      const itemWidth = 132; // card width + gap
      const totalItems = SPIN_ITEMS.length;
      const spinDuration = 3000;
      const startTime = Date.now();
      const startScroll = scrollContainer.scrollLeft;
      
      // Random final position
      const finalSpins = 3 + Math.random() * 2;
      const targetScroll = startScroll + itemWidth * totalItems * finalSpins;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        
        // Easing function for deceleration
        const easeOut = 1 - Math.pow(1 - progress, 4);
        
        const currentScroll = startScroll + (targetScroll - startScroll) * easeOut;
        scrollContainer.scrollLeft = currentScroll;
        
        // Update highlighted index
        const centerOffset = scrollContainer.clientWidth / 2;
        const centerIndex = Math.floor((currentScroll + centerOffset) / itemWidth) % totalItems;
        setHighlightedIndex(centerIndex);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Determine winner
          const random = Math.random() * 100;
          let cumulative = 0;
          let winningPrize: Prize | null = null;
          
          for (const prize of PRIZES) {
            cumulative += prize.probability;
            if (random <= cumulative) {
              winningPrize = prize;
              break;
            }
          }
          
          setIsSpinning(false);
          
          if (winningPrize && winningPrize.value > 0) {
            hapticFeedback('success');
            if (winningPrize.type === 'crystals') {
              addCrystals(winningPrize.value);
              addHistoryEntry({
                type: 'win',
                amount: winningPrize.value,
                description: `Won ${winningPrize.value} crystals`,
              });
            } else {
              addGift(winningPrize);
              addHistoryEntry({
                type: 'win',
                amount: winningPrize.value,
                description: `Won ${winningPrize.name}`,
              });
            }
          } else {
            addHistoryEntry({
              type: 'loss',
              amount: selectedBet,
              description: `Spin - no win`,
            });
          }
        }
      };
      
      animate();
    }
  }, [isSpinning, currentBalance, selectedBet, deductCrystals, hapticFeedback, addCrystals, addGift, addHistoryEntry, incrementGamesPlayed]);

  return (
    <div className="flex flex-col gap-4 pb-24 animate-fade-in">
      {/* User Info Bar */}
      <div className="card-telegram">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden avatar-ring flex-shrink-0">
            {user?.photo_url ? (
              <img src={user.photo_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                {displayName.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold truncate">{displayName}</span>
              {isPremium && <span>🌟</span>}
            </div>
            <div className="text-sm text-muted-foreground">Lvl. {level}</div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xl font-bold">{currentBalance}</span>
            <CrystalIcon size={22} />
          </div>
        </div>
      </div>

      {/* Bet Selection - 4 equal buttons */}
      <div className="grid grid-cols-4 gap-2">
        {BET_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => handleBetSelect(amount)}
            className={cn(
              "rounded-xl py-2.5 font-medium transition-all duration-200 flex items-center justify-center gap-1",
              selectedBet === amount 
                ? "bg-primary/20 border-2 border-primary text-primary" 
                : "bg-secondary border-2 border-transparent text-muted-foreground"
            )}
          >
            <span className="font-semibold">{amount}</span>
            <CrystalIcon size={14} />
          </button>
        ))}
      </div>

      {/* Spin Carousel */}
      <div className="relative">
        {/* Center indicator line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary z-10 -translate-x-1/2" />
        
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide py-2 snap-x snap-mandatory"
        >
          {/* Duplicate items for infinite scroll effect */}
          {[...SPIN_ITEMS, ...SPIN_ITEMS, ...SPIN_ITEMS].map((item, index) => {
            const actualIndex = index % SPIN_ITEMS.length;
            return (
              <div
                key={index}
                className={cn(
                  "flex-shrink-0 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 snap-center",
                  "w-[120px] h-[150px] bg-card",
                  highlightedIndex === actualIndex && isSpinning && "ring-2 ring-primary scale-105"
                )}
              >
                <span className="text-5xl mb-2">{item.emoji}</span>
                <CrystalBadge amount={item.value} size="sm" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Spin Button & Demo Toggle */}
      <div className="flex gap-3">
        <button
          onClick={spinWheel}
          disabled={isSpinning || currentBalance < selectedBet}
          className={cn(
            "flex-1 btn-primary text-base py-4 flex items-center justify-center gap-2 rounded-2xl",
            isSpinning && "opacity-80",
            currentBalance < selectedBet && "opacity-50"
          )}
        >
          <span>I'm lucky, Go!</span>
          <span className="font-bold">{selectedBet}</span>
          <CrystalIcon size={18} />
        </button>
        
        <div className="bg-secondary rounded-2xl px-4 py-2 flex flex-col items-center justify-center">
          <ToggleSwitch 
            checked={isDemoMode} 
            onChange={setDemoMode}
            label="DEMO"
          />
        </div>
      </div>

      {/* Prize Preview */}
      <div className="mt-2">
        <p className="text-center text-muted-foreground mb-3 text-sm">You can win...</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {PRIZES.filter(p => p.value > 0).slice(0, 5).map((prize) => (
            <div key={prize.id} className="bg-card rounded-xl p-3 flex flex-col items-center gap-1.5 min-w-[90px] flex-shrink-0 relative">
              {prize.type === 'crystals' && (
                <div className="absolute -top-1 -left-1 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded -rotate-12 font-bold">
                  CRYSTALS
                </div>
              )}
              <span className="text-3xl">{prize.emoji}</span>
              <span className="text-xs text-muted-foreground">{prize.probability}%</span>
              <CrystalBadge amount={prize.value} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
