"use client";

import { useCallback, useRef } from "react";
import {
  TAP_SLOP,
  dragOffset,
  dragProgress,
  dragRotation,
  evaluateSwipe,
} from "@/lib/swipe";

export type ShuffleDirection = "left" | "right";

/** Where the finger let go, so the throw continues from that exact pose. */
export type ReleasePose = {
  x: number;
  rotation: number;
  progress: number;
};

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  raf: number;
};

/**
 * Swipe-to-shuffle per the consensus spec: primary pointer only, single
 * pointerId, capture held for the whole gesture, visuals written directly to
 * the DOM (rAF-throttled, zero React re-renders), cleanup on up/cancel/
 * lostpointercapture, click suppression cleared on the next pointerdown and
 * by timeout. No visual writes at all under prefers-reduced-motion.
 *
 * Each frame writes two things: the card's transform (follows the finger
 * 1:1 up to FOLLOW_LIMIT), and a `--drag` progress custom property on the
 * DECK element - CSS uses it to raise the under-card toward the top slot in
 * lockstep with the finger.
 */
export function useSwipeShuffle(
  enabled: boolean,
  onShuffle: (direction: ShuffleDirection, release: ReleasePose) => void,
  onRejected?: () => void,
) {
  const cardRef = useRef<HTMLElement | null>(null);
  const deckRef = useRef<HTMLElement | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const suppressTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const resetVisual = useCallback(() => {
    const g = gesture.current;
    if (g?.raf) cancelAnimationFrame(g.raf);
    const el = cardRef.current;
    if (el) {
      // Hand the transform back to CSS (deck-dragging removal re-enables the
      // transitions) so the card and under-card ease home together instead of
      // teleporting when a drag ends below the shuffle threshold.
      el.style.transform = "";
      el.style.userSelect = "";
      el.style.webkitUserSelect = "";
    }
    const deck = deckRef.current;
    if (deck) {
      deck.classList.remove("deck-dragging");
      deck.style.setProperty("--drag", "0");
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
    // The drag drives transforms directly per frame; transitions would lag it.
    deckRef.current?.classList.add("deck-dragging");
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
          const deck = deckRef.current;
          if (current && el) {
            el.style.transform = `translateX(${dragOffset(current.dx)}px) rotate(${dragRotation(current.dx)}deg)`;
          }
          if (current && deck) {
            deck.style.setProperty("--drag", String(dragProgress(current.dx)));
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
        onShuffle(dx < 0 ? "left" : "right", {
          x: dragOffset(dx),
          rotation: dragRotation(dx),
          progress: dragProgress(dx),
        });
      } else if (!enabled && Math.abs(dx) > TAP_SLOP) {
        // A real drag attempt while shuffling is off (3/3 used): tell the
        // caller so the card can wobble "no" instead of silently ignoring it.
        onRejected?.();
      }
    },
    [enabled, endGesture, onShuffle, onRejected],
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

  const setDeck = useCallback((el: HTMLElement | null) => {
    deckRef.current = el;
  }, []);

  return {
    setCard,
    setDeck,
    cardRef,
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
