import { useRef, useCallback, useEffect, useState } from 'react';
import { Prize, PRIZES } from '@/store/gameStore';

export type SpinState = 'preview' | 'spinning' | 'stopped';

const ITEM_WIDTH = 132;
const ITEM_COUNT = 7;
const TOTAL_WIDTH = ITEM_WIDTH * ITEM_COUNT;

// Easing
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

// Calculate winning prize
const calculateWinningPrize = (): Prize => {
  const random = Math.random() * 100;
  let cumulative = 0;
  for (const prize of PRIZES) {
    cumulative += prize.probability;
    if (random <= cumulative) return prize;
  }
  return PRIZES[PRIZES.length - 1];
};

export const useSpinEngine = () => {
  const [spinState, setSpinState] = useState<SpinState>('preview');
  const [position, setPosition] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
  const animationRef = useRef<number>(0);
  const prizeRef = useRef<Prize | null>(null);

  // Preview animation - slow continuous scroll
  useEffect(() => {
    if (spinState !== 'preview') return;
    
    let lastTime = performance.now();
    
    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      
      setPosition(p => (p + 35 * delta) % (TOTAL_WIDTH * 5));
      animationRef.current = requestAnimationFrame(loop);
    };
    
    animationRef.current = requestAnimationFrame(loop);
    
    return () => cancelAnimationFrame(animationRef.current);
  }, [spinState]);

  // Spin animation
  const startSpin = useCallback((): Prize => {
    if (isLocked) return PRIZES[0];
    
    setIsLocked(true);
    cancelAnimationFrame(animationRef.current);
    
    // Calculate prize BEFORE animation
    const prize = calculateWinningPrize();
    prizeRef.current = prize;
    
    // Find target position
    const prizeIndex = PRIZES.findIndex(p => p.id === prize.id) % ITEM_COUNT;
    const startPos = position;
    const cycles = 4 + Math.random() * 2;
    const targetPos = startPos + (cycles * TOTAL_WIDTH) + (prizeIndex * ITEM_WIDTH) - (startPos % TOTAL_WIDTH) + ITEM_WIDTH / 2;
    
    const duration = 3500;
    const startTime = performance.now();
    
    setSpinState('spinning');
    
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      
      const newPos = startPos + (targetPos - startPos) * eased;
      setPosition(newPos);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setPosition(targetPos);
        setSpinState('stopped');
        
        // Return to preview after delay
        setTimeout(() => {
          setSpinState('preview');
          setIsLocked(false);
        }, 1500);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return prize;
  }, [isLocked, position]);

  // Highlighted index calculation
  const highlightedIndex = Math.floor((position + ITEM_WIDTH / 2) / ITEM_WIDTH) % ITEM_COUNT;

  return {
    spinState,
    position,
    highlightedIndex,
    startSpin,
    isLocked,
  };
};
