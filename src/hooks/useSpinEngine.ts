import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const stateRef = useRef<SpinState>("preview");
  const lockedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  const positionRef = useRef(0); // grows over time

  const accelRef = useRef({ startTs: 0, startPos: 0 });
  const decelRef = useRef({ startTs: 0, startPos: 0, targetPos: 0 });
  const winRef = useRef<{ prize: Prize | null; index: number }>({ prize: null, index: 0 });
  const stopTimeoutRef = useRef<number | null>(null);
  const lastHiRef = useRef<number>(-1);

  const normalize = useCallback(
    (pos: number) => ((pos % totalWidth) + totalWidth) % totalWidth,
    [totalWidth]
  );

  const applyTransform = useCallback(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const center = container.clientWidth / 2;
    const pos = normalize(positionRef.current);

    // Keep the visible position inside the middle copy (3x items rendered)
    const renderPos = pos + totalWidth;
    const tx = -renderPos + center - itemSpan / 2;

    track.style.transform = `translate3d(${tx}px, 0, 0)`;
  }, [containerRef, trackRef, normalize, totalWidth, itemSpan]);

  const updateHighlight = useCallback(() => {
    const pos = normalize(positionRef.current);
    const idx = Math.floor((pos + itemSpan / 2) / itemSpan) % items.length;

    if (idx !== lastHiRef.current) {
      lastHiRef.current = idx;
      setHighlightedIndex(idx);
    }
  }, [normalize, itemSpan, items.length]);

  const stopAndSchedulePreview = useCallback(() => {
    stateRef.current = "stopped";
    setSpinState("stopped");

    // Lock transform + highlight exactly at stop
    applyTransform();
    updateHighlight();

    const prize = winRef.current.prize;
    if (prize) onStop?.(prize);

    if (stopTimeoutRef.current) window.clearTimeout(stopTimeoutRef.current);
    stopTimeoutRef.current = window.setTimeout(() => {
      lockedRef.current = false;
      setIsLocked(false);

      stateRef.current = "preview";
      setSpinState("preview");

      lastTsRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    }, stopDelay);
  }, [applyTransform, onStop, stopDelay, updateHighlight]);

  const tick = useCallback(
    (ts: number) => {
      const state = stateRef.current;

      if (lastTsRef.current === 0) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      if (state === "preview") {
        positionRef.current += previewSpeed * dt;
        applyTransform();
        updateHighlight();
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (state === "accelerating") {
        const t = clamp01((ts - accelRef.current.startTs) / accelerationDuration);
        const speed = previewSpeed + (maxSpeed - previewSpeed) * easeInCubic(t);

        positionRef.current += speed * dt;
        applyTransform();
        updateHighlight();

        if (t >= 1) {
          // Transition to deceleration with a precomputed target position.
          stateRef.current = "decelerating";
          setSpinState("decelerating");

          const startPos = positionRef.current;
          const posMod = normalize(startPos);
          const targetMod = winRef.current.index * itemSpan;
          const delta = (targetMod - posMod + totalWidth) % totalWidth;

          decelRef.current.startTs = ts;
          decelRef.current.startPos = startPos;
          decelRef.current.targetPos = startPos + minCycles * totalWidth + delta;
        }

        rafRef.current = requestAnimationFrame(tick);
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

          // Stop: no more RAF until preview resumes.
          stopAndSchedulePreview();
          return;
        }

        rafRef.current = requestAnimationFrame(tick);
      }
    },
    [
      accelerationDuration,
      applyTransform,
      decelerationDuration,
      maxSpeed,
      minCycles,
      normalize,
      previewSpeed,
      stopAndSchedulePreview,
      totalWidth,
      itemSpan,
      updateHighlight,
    ]
  );

  const startSpin = useCallback((): Prize | null => {
    if (lockedRef.current) return null;

    lockedRef.current = true;
    setIsLocked(true);

    // Cancel current RAF loop cleanly (preview)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (stopTimeoutRef.current) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    // Pre-calculate winning prize BEFORE any animation (fair + deterministic for animation)
    const prize = calculateWinningPrize(items);
    const index = Math.max(0, items.findIndex((p) => p.id === prize.id));
    winRef.current = { prize, index };

    stateRef.current = "accelerating";
    setSpinState("accelerating");

    const now = performance.now();
    lastTsRef.current = now;
    accelRef.current = { startTs: now, startPos: positionRef.current };

    rafRef.current = requestAnimationFrame(tick);
    return prize;
  }, [items, tick]);

  // Start preview loop on mount
  useEffect(() => {
    stateRef.current = "preview";
    setSpinState("preview");

    lastTsRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (stopTimeoutRef.current) window.clearTimeout(stopTimeoutRef.current);
    };
  }, [tick]);

  // In case container size changes (mobile rotation), re-apply transform
  useEffect(() => {
    applyTransform();
  }, [applyTransform]);

  return {
    spinState,
    highlightedIndex,
    startSpin,
    isLocked,
  };
};
