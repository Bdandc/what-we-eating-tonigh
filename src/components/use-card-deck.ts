"use client";

import { useCallback, useRef, useState } from "react";
import type { ReleasePose, ShuffleDirection } from "@/components/use-swipe-shuffle";

type Outgoing<T> = {
  item: T;
  direction: ShuffleDirection;
  pose: ReleasePose;
  seq: number;
};

/**
 * Keeps the just-shuffled card around for one animation so it can continue
 * flying off the page FROM THE EXACT POSE the finger released it at, while
 * the under-card finishes rising into the top slot.
 *
 * The throw is EXPLICIT: only the shuffle actions call throwCard(), so view
 * toggles, midnight rollover, and pantry commits swap the card without the
 * shuffle theatrics. Under prefers-reduced-motion the swap is instant.
 */
export function useCardDeck<T extends { id: string }>() {
  const [outgoing, setOutgoing] = useState<Outgoing<T> | null>(null);
  const seq = useRef(0);

  const throwCard = useCallback(
    (item: T | null, direction: ShuffleDirection, pose: ReleasePose) => {
      if (!item) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      seq.current += 1;
      setOutgoing({ item, direction, pose, seq: seq.current });
    },
    [],
  );

  const clearOutgoing = useCallback(() => setOutgoing(null), []);

  return { outgoing, throwCard, clearOutgoing };
}
