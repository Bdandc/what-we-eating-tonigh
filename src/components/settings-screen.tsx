"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { type Weekday, WEEKDAYS } from "@/lib/wawet-data";
import { resetShuffles, setKidsEnabled, setTakeawayDay } from "@/lib/wawet-state";
import { useWawet } from "@/components/use-wawet";

const chevronLeft = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const spinner = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 motion-safe:animate-spin">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const checkIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function SettingsScreen() {
  const [state, setState] = useWawet();
  // Reset feedback: the reset itself is instant, so the button plays a short
  // working -> done sequence purely as click acknowledgement.
  const [resetPhase, setResetPhase] = useState<"idle" | "working" | "done">("idle");
  const resetTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = resetTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  function resetToday() {
    if (resetPhase !== "idle") return;
    setState((s) => (s ? resetShuffles(s) : s));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // No spinner theatre: acknowledge instantly, clear shortly after.
      setResetPhase("done");
      resetTimers.current.push(setTimeout(() => setResetPhase("idle"), 1200));
      return;
    }
    setResetPhase("working");
    resetTimers.current.push(setTimeout(() => setResetPhase("done"), 600));
    resetTimers.current.push(setTimeout(() => setResetPhase("idle"), 2000));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-5">
      <header className="flex items-center">
        <Link href="/" aria-label="Back" className="-ml-1 p-1 text-foreground">
          {chevronLeft}
        </Link>
      </header>

      <h1 className="mt-8 text-[32px] font-bold">Settings</h1>

      {!state ? (
        <div className="mt-8 h-72 animate-pulse rounded-2xl bg-white/70" />
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          <section>
            <h2 className="text-lg font-bold">Takeaway day</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...WEEKDAYS, null].map((day) => {
                const selected = state.settings.takeawayDay === day;
                return (
                  <button
                    key={day ?? "none"}
                    type="button"
                    data-testid={`takeaway-${day ?? "none"}`}
                    aria-pressed={selected}
                    onClick={() => setState((s) => (s ? setTakeawayDay(s, day as Weekday | null) : s))}
                    className={
                      selected
                        ? "rounded-lg border border-green-deep bg-green-light px-4 py-3 text-xs font-bold"
                        : "rounded-lg bg-surface px-4 py-3 text-xs font-bold shadow-sm"
                    }
                  >
                    {day ?? "None"}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Kids Suggestions</h2>
              <p className="mt-1 text-xs text-muted">Show the kids suggestion button</p>
            </div>
            <button
              type="button"
              role="switch"
              data-testid="kids-toggle"
              aria-checked={state.settings.kidsEnabled}
              onClick={() => setState((s) => (s ? setKidsEnabled(s, !s.settings.kidsEnabled) : s))}
              className={
                state.settings.kidsEnabled
                  ? "relative h-7 w-12 rounded-full border border-green-deep/30 bg-green-light transition"
                  : "relative h-7 w-12 rounded-full bg-line transition"
              }
            >
              <span
                className={
                  state.settings.kidsEnabled
                    ? "absolute left-6 top-1 h-5 w-5 rounded-full bg-surface shadow-sm transition-all"
                    : "absolute left-1 top-1 h-5 w-5 rounded-full bg-surface shadow-sm transition-all"
                }
              />
            </button>
          </section>

          <section>
            <h2 className="text-lg font-bold">Your Meals</h2>
            <p className="mt-1 text-xs text-muted">
              Your meals join the suggestions. Pantry items they need can filter them out
            </p>
            <Link
              href="/meals"
              data-testid="view-meals"
              className="mt-3 inline-block text-sm font-bold underline underline-offset-2"
            >
              View Meals
            </Link>
          </section>

          <section>
            <h2 className="text-lg font-bold">Shuffle</h2>
            <button
              type="button"
              data-testid="reset-shuffles"
              data-state={resetPhase}
              aria-busy={resetPhase === "working"}
              disabled={resetPhase !== "idle"}
              onClick={resetToday}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-deep py-3.5 text-base font-bold text-white transition-opacity disabled:opacity-90"
            >
              {resetPhase === "working" ? (
                <>
                  {spinner}
                  Resetting&hellip;
                </>
              ) : resetPhase === "done" ? (
                <>
                  {checkIcon}
                  Shuffles reset
                </>
              ) : (
                <>Reset today&apos;s shuffles</>
              )}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
