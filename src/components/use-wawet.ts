"use client";

import { useEffect, useState } from "react";
import {
  type WawetState,
  loadState,
  rolloverIfNeeded,
  saveState,
} from "@/lib/wawet-state";

/**
 * Client-only state hook. State is null until mounted (the screens render a
 * skeleton), so the server never touches localStorage and hydration stays clean.
 * Rollover runs on mount, on tab focus, and once a minute for tabs left open
 * across midnight.
 */
export function useWawet() {
  const [state, setState] = useState<WawetState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  useEffect(() => {
    const check = () => setState((s) => (s ? rolloverIfNeeded(s) : s));
    const onVisibility = () => {
      if (!document.hidden) check();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const timer = setInterval(check, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(timer);
    };
  }, []);

  return [state, setState] as const;
}
