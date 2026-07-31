"use client";

import { useCallback, useRef } from "react";
import { TAP_SLOP, dragOffset, evaluateSwipe } from "@/lib/swipe";

export type ShuffleDirection = "left" | "right";

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  raf: number;
};

/**
 * Swipe-to-shuffle per the consensus plan: primary pointer only, single
 * pointerId, capture held for the whole gesture, transform written directly
 * to the DOM (rAF-throttled, zero React re-renders), cleanup on up/cancel/
 * lostpointercapture, click suppression cleared on the next pointerdown and
 * by timeout. No transform at all under prefers-reduced-motion.
 */
export function useSwipeShuffle(
  enabled: boolean,
  onShuffle: (direction: ShuffleDirection) => void,
) {
  const cardRef = useRef<HTMLElement | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const suppressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const resetVisual = useCallback(() => {
    const g = gesture.current;
    if (g?.raf) cancelAnimationFrame(g.raf);
    const el = cardRef.current;
    if (el) {
      // Hand the transform back to CSS so the card eases home instead of
      // teleporting when a drag ends below the shuffle threshold.
      el.style.transition = "";
      el.style.transform = "";
      el.style.userSelect = "";
      el.style.webkitUserSelect = "";
    }
  }, []);

  const endGesture = useCallback(
    (event: React.PointerEvent) => {
      const el = cardRef.current;
      if (el && el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
      resetVisual();
      gesture.current = null;
    },
    [resetVisual],
  );

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    // A fresh press always clears any stale post-drag click suppression.
    suppressClick.current = false;
    if (gesture.current) return;
    if (!event.isPrimary) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if ((event.target as Element).closest("button, a, input, [role=button]")) return;
    const el = cardRef.current;
    if (!el) return;
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dx: 0,
      dy: 0,
      raf: 0,
    };
    el.setPointerCapture(event.pointerId);
    // The drag drives transform directly per frame; a transition would lag it.
    el.style.transition = "none";
    el.style.userSelect = "none";
    el.style.webkitUserSelect = "none";
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const g = gesture.current;
      if (!g || event.pointerId !== g.pointerId) return;
      g.dx = event.clientX - g.startX;
      g.dy = event.clientY - g.startY;
      if (!enabled) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (!g.raf) {
        g.raf = requestAnimationFrame(() => {
          const current = gesture.current;
          const el = cardRef.current;
          if (current && el) {
            const offset = dragOffset(current.dx);
            // Small tilt proportional to travel: the card pivots as it lifts.
            el.style.transform = `translateX(${offset}px) rotate(${offset * 0.05}deg)`;
          }
          if (current) current.raf = 0;
        });
      }
    },
    [enabled],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      const g = gesture.current;
      if (!g || event.pointerId !== g.pointerId) return;
      const { dx, dy } = g;
      if (Math.abs(dx) > TAP_SLOP || Math.abs(dy) > TAP_SLOP) {
        suppressClick.current = true;
        clearTimeout(suppressTimer.current);
        suppressTimer.current = setTimeout(() => {
          suppressClick.current = false;
        }, 300);
      }
      endGesture(event);
      if (enabled && evaluateSwipe(dx, dy) === "shuffle") {
        onShuffle(dx < 0 ? "left" : "right");
      }
    },
    [enabled, endGesture, onShuffle],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent) => {
      const g = gesture.current;
      if (!g || event.pointerId !== g.pointerId) return;
      endGesture(event);
    },
    [endGesture],
  );

  const onClickCapture = useCallback((event: React.MouseEvent) => {
    if (suppressClick.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick.current = false;
    }
  }, []);

  const setCard = useCallback((el: HTMLElement | null) => {
    cardRef.current = el;
  }, []);

  return {
    setCard,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onLostPointerCapture: onPointerCancel,
      onClickCapture,
    },
  };
}
