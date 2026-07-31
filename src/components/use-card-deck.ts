"use client";

import { useCallback, useRef, useState } from "react";
import type { ShuffleDirection } from "@/components/use-swipe-shuffle";

type Outgoing<T> = { item: T; direction: ShuffleDirection; seq: number };

/**
 * Keeps the just-shuffled card around for one animation so it can be thrown
 * off the deck while the next one rises into its place.
 *
 * The throw is EXPLICIT: only the shuffle actions call throwCard(), so view
 * toggles, midnight rollover, and pantry commits swap the card without the
 * shuffle theatrics (they are not shuffles and must not look like one).
 * Under prefers-reduced-motion nothing is retained and the swap is instant.
 */
export function useCardDeck<T extends { id: string }>() {
  const [outgoing, setOutgoing] = useState<Outgoing<T> | null>(null);
  const seq = useRef(0);

  const throwCard = useCallback((item: T | null, direction: ShuffleDirection) => {
    if (!item) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    seq.current += 1;
    setOutgoing({ item, direction, seq: seq.current });
  }, []);

  const clearOutgoing = useCallback(() => setOutgoing(null), []);

  return { outgoing, throwCard, clearOutgoing };
}
