import { useRef, useCallback, useEffect, useState } from 'react';
import { Prize, PRIZES } from '@/store/gameStore';

export type SpinState = 'preview' | 'accelerating' | 'decelerating' | 'stopped';

interface SpinEngineConfig {
  itemWidth: number;
  itemCount: number;
  previewSpeed: number;
  maxSpeed: number;
  accelerationDuration: number;
  decelerationDuration: number;
  stopDelay: number;
}

const DEFAULT_CONFIG: SpinEngineConfig = {
  itemWidth: 132,
  itemCount: 7,
  previewSpeed: 40,
  maxSpeed: 2000,
  accelerationDuration: 600,
  decelerationDuration: 2500,
  stopDelay: 1200,
};

// Easing functions
const easeInCubic = (t: number) => t * t * t;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

// Precalculate winning prize
const calculateWinningPrize = (): Prize => {
  const random = Math.random() * 100;
  let cumulative = 0;
  for (const prize of PRIZES) {
    cumulative += prize.probability;
    if (random <= cumulative) return prize;
  }
  return PRIZES[PRIZES.length - 1];
};

export const useSpinEngine = (config: Partial<SpinEngineConfig> = {}) => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const totalWidth = cfg.itemWidth * cfg.itemCount;

  // Use refs for animation state to avoid stale closures
  const stateRef = useRef<SpinState>('preview');
  const positionRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const lockedRef = useRef(false);

  // Spin data
  const spinDataRef = useRef({
    startTime: 0,
    startPosition: 0,
    targetPosition: 0,
    targetPrize: null as Prize | null,
  });

  // React state for UI updates
  const [, forceUpdate] = useState(0);
  const triggerRender = useCallback(() => forceUpdate(n => n + 1), []);

  // Calculate highlighted index
  const getHighlightedIndex = useCallback((pos: number): number => {
    const normalized = ((pos % totalWidth) + totalWidth) % totalWidth;
    return Math.floor((normalized + cfg.itemWidth / 2) / cfg.itemWidth) % cfg.itemCount;
  }, [totalWidth, cfg.itemWidth, cfg.itemCount]);

  // Main animation loop - handles all states
  const animate = useCallback((timestamp: number) => {
    const state = stateRef.current;

    if (state === 'preview') {
      // Slow continuous scroll
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      
      positionRef.current += cfg.previewSpeed * delta;
      if (positionRef.current > totalWidth * 10) {
        positionRef.current = positionRef.current % totalWidth;
      }
      
      triggerRender();
      animationRef.current = requestAnimationFrame(animate);
    } 
    else if (state === 'accelerating') {
      const { startTime, startPosition } = spinDataRef.current;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / cfg.accelerationDuration, 1);
      
      // Ease in - accelerate
      const eased = easeInCubic(progress);
      const speed = cfg.previewSpeed + (cfg.maxSpeed - cfg.previewSpeed) * eased;
      const distance = speed * (elapsed / 1000) * 0.5;
      
      positionRef.current = startPosition + distance;
      triggerRender();

      if (progress >= 1) {
        // Transition to deceleration
        const currentPos = positionRef.current;
        const targetPrize = spinDataRef.current.targetPrize;
        
        if (targetPrize) {
          const prizeIndex = PRIZES.findIndex(p => p.id === targetPrize.id) % cfg.itemCount;
          const currentCycle = Math.floor(currentPos / totalWidth);
          
          // Calculate where we need to stop
          let targetPos = (currentCycle + 3) * totalWidth + prizeIndex * cfg.itemWidth;
          const minDistance = cfg.maxSpeed * (cfg.decelerationDuration / 1000) * 0.3;
          
          while (targetPos - currentPos < minDistance) {
            targetPos += totalWidth;
          }
          
          spinDataRef.current.startTime = timestamp;
          spinDataRef.current.startPosition = currentPos;
          spinDataRef.current.targetPosition = targetPos;
        }
        
        stateRef.current = 'decelerating';
      }
      
      animationRef.current = requestAnimationFrame(animate);
    } 
    else if (state === 'decelerating') {
      const { startTime, startPosition, targetPosition } = spinDataRef.current;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / cfg.decelerationDuration, 1);
      
      // Ease out - decelerate smoothly
      const eased = easeOutQuart(progress);
      const distance = (targetPosition - startPosition) * eased;
      
      positionRef.current = startPosition + distance;
      triggerRender();

      if (progress >= 1) {
        positionRef.current = targetPosition;
        stateRef.current = 'stopped';
        triggerRender();
        
        // Return to preview after delay
        setTimeout(() => {
          stateRef.current = 'preview';
          lockedRef.current = false;
          lastTimeRef.current = 0;
          triggerRender();
          animationRef.current = requestAnimationFrame(animate);
        }, cfg.stopDelay);
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    }
    // 'stopped' state - no animation, wait for timeout
  }, [cfg, totalWidth, triggerRender]);

  // Start spin
  const startSpin = useCallback((): Prize => {
    if (lockedRef.current) return PRIZES[0];
    
    lockedRef.current = true;
    
    // Cancel current animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Precalculate prize
    const prize = calculateWinningPrize();
    
    spinDataRef.current = {
      startTime: performance.now(),
      startPosition: positionRef.current,
      targetPosition: 0,
      targetPrize: prize,
    };
    
    stateRef.current = 'accelerating';
    triggerRender();
    animationRef.current = requestAnimationFrame(animate);
    
    return prize;
  }, [animate, triggerRender]);

  // Initialize preview on mount
  useEffect(() => {
    stateRef.current = 'preview';
    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  return {
    spinState: stateRef.current,
    position: positionRef.current,
    highlightedIndex: getHighlightedIndex(positionRef.current),
    startSpin,
    isLocked: lockedRef.current,
  };
};
