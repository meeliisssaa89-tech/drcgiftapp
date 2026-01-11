import { useState, useCallback, useMemo, useRef } from 'react';
import { CrystalIcon, CrystalBadge } from '@/components/CrystalIcon';
import { ToggleSwitch } from '@/components/ToggleSwitch';
import { WinModal } from '@/components/WinModal';
import { useGameStore, PRIZES, Prize } from '@/store/gameStore';
import { useProfile } from '@/hooks/useProfile';
import { useTelegram } from '@/hooks/useTelegram';
import { useSpinEngine } from '@/hooks/useSpinEngine';
import { cn } from '@/lib/utils';

const BET_AMOUNTS = [25, 50, 100, 250];

const ITEM_WIDTH = 120;
const ITEM_GAP = 12;
const ITEM_SPAN = ITEM_WIDTH + ITEM_GAP;

export const PlayPage = () => {
  const { user, hapticFeedback } = useTelegram();
  const { profile, deductCrystals, addCrystals, recordGame, isLoading } = useProfile();
  const {
    isDemoMode,
    demoCrystals,
    setDemoMode,
    addDemoCrystals,
    deductDemoCrystals,
    addGift,
  } = useGameStore();

  const [selectedBet, setSelectedBet] = useState(25);
  const [showWinModal, setShowWinModal] = useState(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);

  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const carouselTrackRef = useRef<HTMLDivElement>(null);

  // Keep spin context stable until stop
  const spinCtxRef = useRef<{ bet: number; isDemo: boolean } | null>(null);

  const crystals = profile?.crystals ?? 0;
  const level = profile?.level ?? 1;
  const currentBalance = isDemoMode ? demoCrystals : crystals;
  const displayName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'User';
  const isPremium = user?.is_premium;

  const spinItems = useMemo(
    () => PRIZES.map((p) => ({ id: p.id, emoji: p.emoji, value: p.value, label: p.name })),
    []
  );

  // Generate carousel items (3x for seamless loop)
  const carouselItems = useMemo(() => {
    const items: Array<{ key: string; index: number; emoji: string; value: number }> = [];
    for (let i = 0; i < 3; i++) {
      spinItems.forEach((item, idx) => {
        items.push({ key: `${i}-${item.id}`, index: idx, emoji: item.emoji, value: item.value });
      });
    }
    return items;
  }, [spinItems]);

  const applyPrizeAndShow = useCallback(
    (winningPrize: Prize) => {
      const ctx = spinCtxRef.current;
      if (!ctx) return;

      const bet = ctx.bet;
      const demo = ctx.isDemo;

      if (winningPrize.value > 0) {
        hapticFeedback('success');

        if (demo) {
          if (winningPrize.type === 'crystals') {
            addDemoCrystals(winningPrize.value);
          } else {
            addGift(winningPrize);
          }
        } else {
          if (winningPrize.type === 'crystals') {
            addCrystals(winningPrize.value);
          } else {
            addGift(winningPrize);
          }

          recordGame(bet, winningPrize.value, winningPrize.emoji, winningPrize.name, false);
        }

        setWonPrize(winningPrize);
        setTimeout(() => setShowWinModal(true), 250);
      } else {
        if (!demo) {
          recordGame(bet, 0, '💨', 'No win', false);
        }
      }

      // clear context after applying
      spinCtxRef.current = null;
    },
    [addCrystals, addDemoCrystals, addGift, hapticFeedback, recordGame]
  );

  const { spinState, highlightedIndex, startSpin, isLocked } = useSpinEngine({
    containerRef: carouselContainerRef,
    trackRef: carouselTrackRef,
    items: PRIZES,
    itemSpan: ITEM_SPAN,
    onStop: applyPrizeAndShow,
  });

  const handleBetSelect = (amount: number) => {
    if (isLocked) return;
    hapticFeedback('selection');
    setSelectedBet(amount);
  };

  const handleSpin = useCallback(async () => {
    if (isLocked) return;

    if (currentBalance < selectedBet) {
      hapticFeedback('error');
      return;
    }

    // Deduct BEFORE spin starts
    if (isDemoMode) {
      if (!deductDemoCrystals(selectedBet)) {
        hapticFeedback('error');
        return;
      }
    } else {
      const success = await deductCrystals(selectedBet);
      if (!success) {
        hapticFeedback('error');
        return;
      }
    }

    // Lock context for this round
    spinCtxRef.current = { bet: selectedBet, isDemo: isDemoMode };

    hapticFeedback('medium');
    const prize = startSpin();

    // If for any reason spin didn't start, restore lock/context
    if (!prize) {
      spinCtxRef.current = null;
      hapticFeedback('error');
    }
  }, [isLocked, currentBalance, selectedBet, isDemoMode, deductDemoCrystals, deductCrystals, hapticFeedback, startSpin]);

  const closeWinModal = () => {
    setShowWinModal(false);
    setWonPrize(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 pb-24 animate-fade-in">
        <div className="card-telegram animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-secondary rounded w-24" />
              <div className="h-3 bg-secondary rounded w-16" />
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Bet Selection */}
      <div className="grid grid-cols-4 gap-2">
        {BET_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => handleBetSelect(amount)}
            disabled={isLocked}
            className={cn(
              'rounded-xl py-2.5 font-medium transition-all duration-200 flex items-center justify-center gap-1',
              selectedBet === amount
                ? 'bg-primary/20 border-2 border-primary text-primary'
                : 'bg-secondary border-2 border-transparent text-muted-foreground',
              isLocked && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="font-semibold">{amount}</span>
            <CrystalIcon size={14} />
          </button>
        ))}
      </div>

      {/* Spin Carousel */}
      <div
        ref={carouselContainerRef}
        className="relative overflow-hidden rounded-2xl bg-card/50 py-4"
      >
        {/* Center indicator line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary z-20 -translate-x-1/2 shadow-[0_0_12px_hsl(var(--primary)/0.35)]" />

        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-card/90 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-card/90 to-transparent z-10 pointer-events-none" />

        {/* Carousel track (transform controlled by RAF in hook) */}
        <div ref={carouselTrackRef} className="flex gap-3 will-change-transform">
          {carouselItems.map((item) => {
            const isHighlighted = item.index === highlightedIndex && spinState !== 'preview';
            const isWinner = item.index === highlightedIndex && spinState === 'stopped';

            return (
              <div
                key={item.key}
                className={cn(
                  'flex-shrink-0 rounded-2xl flex flex-col items-center justify-center transition-all duration-150',
                  'bg-secondary/80 backdrop-blur-sm',
                  isHighlighted && 'ring-2 ring-primary/50 scale-[1.02]',
                  isWinner && 'ring-4 ring-primary scale-110 bg-primary/20 shadow-lg shadow-primary/30'
                )}
                style={{ width: ITEM_WIDTH, height: 150 }}
              >
                <span
                  className={cn(
                    'text-5xl mb-2 transition-transform duration-150',
                    isWinner && 'animate-bounce'
                  )}
                >
                  {item.emoji}
                </span>
                <CrystalBadge amount={item.value} size="sm" />
              </div>
            );
          })}
        </div>

        {/* Spin state indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/50 uppercase tracking-wider">
          {spinState === 'preview' && 'Ready'}
          {spinState === 'accelerating' && 'Spinning...'}
          {spinState === 'decelerating' && 'Slowing...'}
          {spinState === 'stopped' && '🎉'}
        </div>
      </div>

      {/* Spin Button & Demo Toggle */}
      <div className="flex gap-3">
        <button
          onClick={handleSpin}
          disabled={isLocked || currentBalance < selectedBet}
          className={cn(
            'flex-1 btn-primary text-base py-4 flex items-center justify-center gap-2 rounded-2xl font-semibold',
            'transition-all duration-200',
            isLocked && 'opacity-80 cursor-not-allowed',
            currentBalance < selectedBet && !isLocked && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isLocked ? (
            <span className="animate-pulse">Spinning...</span>
          ) : (
            <>
              <span>I'm lucky, Go!</span>
              <span className="font-bold">{selectedBet}</span>
              <CrystalIcon size={18} />
            </>
          )}
        </button>

        <div className="bg-secondary rounded-2xl px-4 py-2 flex flex-col items-center justify-center">
          <ToggleSwitch checked={isDemoMode} onChange={setDemoMode} label="DEMO" />
        </div>
      </div>

      {/* Prize Preview */}
      <div className="mt-2">
        <p className="text-center text-muted-foreground mb-3 text-sm">You can win...</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {PRIZES.filter((p) => p.value > 0)
            .slice(0, 5)
            .map((prize) => (
              <div
                key={prize.id}
                className="bg-card rounded-xl p-3 flex flex-col items-center gap-1.5 min-w-[90px] flex-shrink-0 relative"
              >
                {prize.type === 'crystals' && (
                  <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded -rotate-12 font-bold">
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

      {/* Win Modal */}
      <WinModal isOpen={showWinModal} onClose={closeWinModal} prize={wonPrize} />
    </div>
  );
};
