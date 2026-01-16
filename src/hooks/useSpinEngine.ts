import { useEffect, useMemo, useRef, useState } from "react";
import type { Prize } from "@/store/gameStore";

export type SpinState = "preview" | "accelerating" | "decelerating" | "stopped";

type SpinEngineOptions = {
  containerRef: React.RefObject<HTMLElement>;
  trackRef: React.RefObject<HTMLElement>;
  items: Prize[];
  itemSpan: number; // item width + gap (px)

  previewSpeed?: number; // px/s
  maxSpeed?: number; // px/s
  accelerationDuration?: number; // ms
  decelerationDuration?: number; // ms
  minCycles?: number; // full cycles during decel (visual feel)
  stopDelay?: number; // ms

  // fires exactly when the animation locks on the winning item
  onStop?: (prize: Prize) => void;
};

const easeInCubic = (t: number) => t * t * t;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

const calculateWinningPrize = (items: Prize[]): Prize => {
  const random = Math.random() * 100;
  let cumulative = 0;
  for (const prize of items) {
    cumulative += prize.probability;
    if (random <= cumulative) return prize;
  }
  return items[items.length - 1];
};

// Polyfill for performance.now() - some Telegram WebViews have issues
const getTimestamp = (): number => {
  if (typeof performance !== 'undefined' && performance.now) {
    return performance.now();
  }
  return Date.now();
};

// Safe requestAnimationFrame with fallback for Telegram WebView
const safeRAF = (callback: (ts: number) => void): number => {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame(callback);
  }
  // Fallback to setTimeout for environments without RAF
  return window.setTimeout(() => callback(getTimestamp()), 16) as unknown as number;
};

const safeCancelRAF = (id: number | null) => {
  if (id === null) return;
  if (typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
};

export const useSpinEngine = ({
  containerRef,
  trackRef,
  items,
  itemSpan,
  previewSpeed = 36,
  maxSpeed = 2200,
  accelerationDuration = 650,
  decelerationDuration = 2300,
  minCycles = 3,
  stopDelay = 1100,
  onStop,
}: SpinEngineOptions) => {
  const totalWidth = useMemo(() => itemSpan * items.length, [itemSpan, items.length]);

  const [spinState, setSpinState] = useState<SpinState>("preview");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Use refs for all mutable state to avoid re-creating callbacks
  const stateRef = useRef<SpinState>("preview");
  const lockedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const positionRef = useRef(0);
  const accelRef = useRef({ startTs: 0, startPos: 0 });
  const decelRef = useRef({ startTs: 0, startPos: 0, targetPos: 0 });
  const winRef = useRef<{ prize: Prize | null; index: number }>({ prize: null, index: 0 });
  const stopTimeoutRef = useRef<number | null>(null);
  const lastHiRef = useRef<number>(-1);

  // Store stable references to props
  const itemsRef = useRef(items);
  const onStopRef = useRef(onStop);
  const totalWidthRef = useRef(totalWidth);
  const itemSpanRef = useRef(itemSpan);

  // Update refs when props change
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  useEffect(() => {
    totalWidthRef.current = totalWidth;
  }, [totalWidth]);

  useEffect(() => {
    itemSpanRef.current = itemSpan;
  }, [itemSpan]);

  // Stable normalize function using refs
  const normalize = (pos: number) => {
    const tw = totalWidthRef.current;
    return ((pos % tw) + tw) % tw;
  };

  // Stable applyTransform using refs
  const applyTransform = () => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const center = container.clientWidth / 2;
    const pos = normalize(positionRef.current);
    const tw = totalWidthRef.current;
    const iSpan = itemSpanRef.current;

    const renderPos = pos + tw;
    const tx = -renderPos + center - iSpan / 2;

    track.style.transform = `translate3d(${tx}px, 0, 0)`;
  };

  // Stable updateHighlight using refs
  const updateHighlight = () => {
    const pos = normalize(positionRef.current);
    const iSpan = itemSpanRef.current;
    const len = itemsRef.current.length;
    const idx = Math.floor((pos + iSpan / 2) / iSpan) % len;

    if (idx !== lastHiRef.current) {
      lastHiRef.current = idx;
      setHighlightedIndex(idx);
    }
  };

  // Stable tick function - defined once and uses refs
  const tickFnRef = useRef<(ts: number) => void>();

  const stopAndSchedulePreview = () => {
    stateRef.current = "stopped";
    setSpinState("stopped");

    applyTransform();
    updateHighlight();

    const prize = winRef.current.prize;
    if (prize) onStopRef.current?.(prize);

    if (stopTimeoutRef.current) {
      window.clearTimeout(stopTimeoutRef.current);
    }
    stopTimeoutRef.current = window.setTimeout(() => {
      lockedRef.current = false;
      setIsLocked(false);

      stateRef.current = "preview";
      setSpinState("preview");

      lastTsRef.current = 0;
      if (tickFnRef.current) {
        rafRef.current = safeRAF(tickFnRef.current);
      }
    }, stopDelay);
  };

  // Define tick once
  tickFnRef.current = (ts: number) => {
    const state = stateRef.current;

    if (lastTsRef.current === 0) lastTsRef.current = ts;
    const dt = (ts - lastTsRef.current) / 1000;
    lastTsRef.current = ts;

    if (state === "preview") {
      positionRef.current += previewSpeed * dt;
      applyTransform();
      updateHighlight();
      rafRef.current = safeRAF(tickFnRef.current!);
      return;
    }

    if (state === "accelerating") {
      const t = clamp01((ts - accelRef.current.startTs) / accelerationDuration);
      const speed = previewSpeed + (maxSpeed - previewSpeed) * easeInCubic(t);

      positionRef.current += speed * dt;
      applyTransform();
      updateHighlight();

      if (t >= 1) {
        stateRef.current = "decelerating";
        setSpinState("decelerating");

        const startPos = positionRef.current;
        const posMod = normalize(startPos);
        const tw = totalWidthRef.current;
        const iSpan = itemSpanRef.current;
        const targetMod = winRef.current.index * iSpan;
        const delta = (targetMod - posMod + tw) % tw;

        decelRef.current.startTs = ts;
        decelRef.current.startPos = startPos;
        decelRef.current.targetPos = startPos + minCycles * tw + delta;
      }

      rafRef.current = safeRAF(tickFnRef.current!);
      return;
    }

    if (state === "decelerating") {
      const t = clamp01((ts - decelRef.current.startTs) / decelerationDuration);
      const eased = easeOutQuart(t);

      positionRef.current =
        decelRef.current.startPos +
        (decelRef.current.targetPos - decelRef.current.startPos) * eased;

      applyTransform();
      updateHighlight();

      if (t >= 1) {
        positionRef.current = decelRef.current.targetPos;
        applyTransform();
        updateHighlight();

        stopAndSchedulePreview();
        return;
      }

      rafRef.current = safeRAF(tickFnRef.current!);
    }
  };

  const startSpin = (): Prize | null => {
    if (lockedRef.current) return null;

    lockedRef.current = true;
    setIsLocked(true);

    if (rafRef.current) {
      safeCancelRAF(rafRef.current);
      rafRef.current = null;
    }
    if (stopTimeoutRef.current) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    const prize = calculateWinningPrize(itemsRef.current);
    const index = Math.max(0, itemsRef.current.findIndex((p) => p.id === prize.id));
    winRef.current = { prize, index };

    stateRef.current = "accelerating";
    setSpinState("accelerating");

    const now = getTimestamp();
    lastTsRef.current = now;
    accelRef.current = { startTs: now, startPos: positionRef.current };

    if (tickFnRef.current) {
      rafRef.current = safeRAF(tickFnRef.current);
    }
    return prize;
  };

  // Start preview loop on mount - only runs once
  useEffect(() => {
    stateRef.current = "preview";
    setSpinState("preview");

    lastTsRef.current = 0;
    if (tickFnRef.current) {
      rafRef.current = safeRAF(tickFnRef.current);
    }

    return () => {
      safeCancelRAF(rafRef.current);
      if (stopTimeoutRef.current) window.clearTimeout(stopTimeoutRef.current);
    };
  }, []); // Empty deps - only mount/unmount

  return {
    spinState,
    highlightedIndex,
    startSpin,
    isLocked,
  };
};
