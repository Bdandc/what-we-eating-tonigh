"use client";

import Link from "next/link";
import { type Weekday, WEEKDAYS } from "@/lib/wawet-data";
import { resetShuffles, setKidsEnabled, setTakeawayDay } from "@/lib/wawet-state";
import { useWawet } from "@/components/use-wawet";

const chevronLeft = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function SettingsScreen() {
  const [state, setState] = useWawet();

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
              onClick={() => setState((s) => (s ? resetShuffles(s) : s))}
              className="mt-3 w-full rounded-lg bg-green-deep py-3.5 text-base font-bold text-white"
            >
              Reset today&apos;s shuffles
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
