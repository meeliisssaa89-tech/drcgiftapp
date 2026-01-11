import { useRef, useCallback, useEffect, useState } from 'react';
import { Prize, PRIZES } from '@/store/gameStore';

export type SpinState = 'preview' | 'accelerating' | 'decelerating' | 'stopped';

interface SpinEngineConfig {
  itemWidth: number;
  itemCount: number;
  previewSpeed: number; // pixels per second
  maxSpeed: number; // pixels per second
  accelerationDuration: number; // ms
  decelerationDuration: number; // ms
  stopDelay: number; // ms before returning to preview
}

const DEFAULT_CONFIG: SpinEngineConfig = {
  itemWidth: 132, // 120px card + 12px gap
  itemCount: 7,
  previewSpeed: 30, // slow idle scroll
  maxSpeed: 2500, // fast spin speed
  accelerationDuration: 800,
  decelerationDuration: 2000,
  stopDelay: 1500,
};

interface UseSpinEngineReturn {
  spinState: SpinState;
  position: number;
  highlightedIndex: number;
  startSpin: () => Prize;
  isLocked: boolean;
}

// Easing functions
const easeInQuad = (t: number) => t * t;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

// Precalculate winning prize based on probabilities
const calculateWinningPrize = (): Prize => {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const prize of PRIZES) {
    cumulative += prize.probability;
    if (random <= cumulative) {
      return prize;
    }
  }
  
  return PRIZES[PRIZES.length - 1]; // Fallback to last prize
};

export const useSpinEngine = (
  config: Partial<SpinEngineConfig> = {}
): UseSpinEngineReturn => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  const [spinState, setSpinState] = useState<SpinState>('preview');
  const [position, setPosition] = useState(0);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const stateDataRef = useRef<{
    startTime: number;
    startPosition: number;
    startSpeed: number;
    targetPosition: number;
    targetPrize: Prize | null;
  }>({
    startTime: 0,
    startPosition: 0,
    startSpeed: 0,
    targetPosition: 0,
    targetPrize: null,
  });
  
  const totalWidth = cfg.itemWidth * cfg.itemCount;
  
  // Calculate which item is under the center indicator
  const calculateHighlightedIndex = useCallback((pos: number): number => {
    // Normalize position to be within one cycle
    const normalizedPos = ((pos % totalWidth) + totalWidth) % totalWidth;
    // Add half item width to center the calculation
    const centerOffset = cfg.itemWidth / 2;
    return Math.floor((normalizedPos + centerOffset) / cfg.itemWidth) % cfg.itemCount;
  }, [cfg.itemWidth, cfg.itemCount, totalWidth]);
  
  // Preview animation loop
  const previewLoop = useCallback((timestamp: number) => {
    if (spinState !== 'preview') return;
    
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }
    
    const deltaTime = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;
    
    setPosition(prev => {
      const newPos = prev + cfg.previewSpeed * deltaTime;
      return newPos % (totalWidth * 3); // Keep within bounds
    });
    
    animationRef.current = requestAnimationFrame(previewLoop);
  }, [spinState, cfg.previewSpeed, totalWidth]);
  
  // Acceleration animation
  const accelerationLoop = useCallback((timestamp: number) => {
    if (spinState !== 'accelerating') return;
    
    const { startTime, startPosition } = stateDataRef.current;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / cfg.accelerationDuration, 1);
    
    // Ease in - start slow, get faster
    const easedProgress = easeInQuad(progress);
    const currentSpeed = cfg.previewSpeed + (cfg.maxSpeed - cfg.previewSpeed) * easedProgress;
    
    // Calculate distance traveled
    const avgSpeed = (cfg.previewSpeed + currentSpeed) / 2;
    const distance = avgSpeed * (elapsed / 1000);
    
    const newPos = startPosition + distance;
    setPosition(newPos);
    setHighlightedIndex(calculateHighlightedIndex(newPos));
    
    if (progress >= 1) {
      // Transition to deceleration
      stateDataRef.current.startTime = timestamp;
      stateDataRef.current.startPosition = newPos;
      stateDataRef.current.startSpeed = cfg.maxSpeed;
      
      // Calculate target position to land on the prize
      const targetPrize = stateDataRef.current.targetPrize;
      if (targetPrize) {
        // Find the index of the target prize in SPIN_ITEMS equivalent
        const prizeIndex = PRIZES.findIndex(p => p.id === targetPrize.id) % cfg.itemCount;
        
        // Calculate minimum travel distance during deceleration
        const minDecelerationDistance = cfg.maxSpeed * (cfg.decelerationDuration / 1000) * 0.4;
        
        // Calculate target position
        const currentCycle = Math.floor(newPos / totalWidth);
        let targetPos = (currentCycle + 2) * totalWidth + prizeIndex * cfg.itemWidth + cfg.itemWidth / 2;
        
        // Ensure we travel at least the minimum distance
        while (targetPos - newPos < minDecelerationDistance) {
          targetPos += totalWidth;
        }
        
        stateDataRef.current.targetPosition = targetPos;
      }
      
      setSpinState('decelerating');
      animationRef.current = requestAnimationFrame(decelerationLoop);
    } else {
      animationRef.current = requestAnimationFrame(accelerationLoop);
    }
  }, [spinState, cfg, calculateHighlightedIndex, totalWidth]);
  
  // Deceleration animation
  const decelerationLoop = useCallback((timestamp: number) => {
    if (spinState !== 'decelerating') return;
    
    const { startTime, startPosition, targetPosition } = stateDataRef.current;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / cfg.decelerationDuration, 1);
    
    // Ease out - start fast, slow down
    const easedProgress = easeOutQuart(progress);
    
    const totalDistance = targetPosition - startPosition;
    const currentDistance = totalDistance * easedProgress;
    const newPos = startPosition + currentDistance;
    
    setPosition(newPos);
    setHighlightedIndex(calculateHighlightedIndex(newPos));
    
    if (progress >= 1) {
      // Snap to exact target position
      setPosition(targetPosition);
      setSpinState('stopped');
      
      // After delay, return to preview
      setTimeout(() => {
        setSpinState('preview');
        setIsLocked(false);
        lastTimeRef.current = 0;
      }, cfg.stopDelay);
    } else {
      animationRef.current = requestAnimationFrame(decelerationLoop);
    }
  }, [spinState, cfg.decelerationDuration, cfg.stopDelay, calculateHighlightedIndex]);
  
  // Start spin action
  const startSpin = useCallback((): Prize => {
    if (isLocked || spinState === 'accelerating' || spinState === 'decelerating') {
      return PRIZES[0]; // Return dummy, but this shouldn't happen
    }
    
    // Lock the spin
    setIsLocked(true);
    
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // CRITICAL: Precalculate prize BEFORE animation starts
    const winningPrize = calculateWinningPrize();
    
    // Initialize acceleration state
    stateDataRef.current = {
      startTime: performance.now(),
      startPosition: position,
      startSpeed: cfg.previewSpeed,
      targetPosition: 0, // Will be calculated when transitioning to deceleration
      targetPrize: winningPrize,
    };
    
    setSpinState('accelerating');
    animationRef.current = requestAnimationFrame(accelerationLoop);
    
    return winningPrize;
  }, [isLocked, spinState, position, cfg.previewSpeed, accelerationLoop]);
  
  // Effect to manage animation loops based on state
  useEffect(() => {
    if (spinState === 'preview') {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(previewLoop);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [spinState, previewLoop]);
  
  // Update highlighted index during preview
  useEffect(() => {
    if (spinState === 'preview') {
      setHighlightedIndex(calculateHighlightedIndex(position));
    }
  }, [position, spinState, calculateHighlightedIndex]);
  
  return {
    spinState,
    position,
    highlightedIndex,
    startSpin,
    isLocked,
  };
};
