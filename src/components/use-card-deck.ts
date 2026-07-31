"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ShuffleDirection } from "@/components/use-swipe-shuffle";

type Outgoing<T> = { item: T; direction: ShuffleDirection; seq: number };

/**
 * Keeps the previous card around for one animation so it can be thrown off the
 * deck while the next one rises into its place.
 *
 * The direction is recorded before the state change lands (by the swipe hook or
 * the Shuffle button), so the card always leaves the way it was pushed.
 * Under prefers-reduced-motion nothing is retained and the swap is instant.
 */
export function useCardDeck<T extends { id: string }>(current: T | null) {
  const [outgoing, setOutgoing] = useState<Outgoing<T> | null>(null);
  const previous = useRef<T | null>(current);
  const direction = useRef<ShuffleDirection>("left");
  const seq = useRef(0);

  useEffect(() => {
    const before = previous.current;
    previous.current = current;
    if (!before || !current || before.id === current.id) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    seq.current += 1;
    setOutgoing({
      item: before,
      direction: direction.current,
      seq: seq.current,
    });
  }, [current]);

  const setDirection = useCallback((next: ShuffleDirection) => {
    direction.current = next;
  }, []);

  const clearOutgoing = useCallback(() => setOutgoing(null), []);

  return { outgoing, setDirection, clearOutgoing };
}
