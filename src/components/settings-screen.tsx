"use client";

import Link from "next/link";
import { type Weekday, WEEKDAYS } from "@/lib/wawet-data";
import {
  removeCustomMeal,
  resetShuffles,
  setKidsEnabled,
  setTakeawayDay,
} from "@/lib/wawet-state";
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

      <h1 className="mt-6 text-[22px] font-bold">Settings</h1>

      {!state ? (
        <div className="mt-8 h-72 animate-pulse rounded-2xl bg-white/70" />
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          <section>
            <h2 className="text-base font-bold">Takeaway day</h2>
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
                        ? "rounded-lg bg-green-deep px-4 py-3 text-xs font-bold text-white"
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
              <h2 className="text-base font-bold">Kids suggestions</h2>
              <p className="mt-1 text-xs text-muted">Show the kids suggestion button.</p>
            </div>
            <button
              type="button"
              role="switch"
              data-testid="kids-toggle"
              aria-checked={state.settings.kidsEnabled}
              onClick={() => setState((s) => (s ? setKidsEnabled(s, !s.settings.kidsEnabled) : s))}
              className={
                state.settings.kidsEnabled
                  ? "relative h-7 w-12 rounded-full bg-green-deep transition"
                  : "relative h-7 w-12 rounded-full bg-line transition"
              }
            >
              <span
                className={
                  state.settings.kidsEnabled
                    ? "absolute left-6 top-1 h-5 w-5 rounded-full bg-surface transition-all"
                    : "absolute left-1 top-1 h-5 w-5 rounded-full bg-surface transition-all"
                }
              />
            </button>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Your meals</h2>
              <Link href="/settings/add-meal" data-testid="add-meal" className="text-sm font-bold">
                Add a meal
              </Link>
            </div>
            <p className="mt-1 text-xs text-muted">
              Your meals join the suggestions. Pantry items they need can filter them out.
            </p>
            {state.customMeals.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-2">
                {state.customMeals.map((meal) => (
                  <li
                    key={meal.id}
                    className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 shadow-sm"
                  >
                    <span className="text-xs font-bold">
                      {meal.name}
                      <span className="ml-2 font-normal text-muted">
                        {meal.kind === "kids" ? "Kids" : "Family"}
                      </span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${meal.name}`}
                      onClick={() => setState((s) => (s ? removeCustomMeal(s, meal.id) : s))}
                      className="text-xs font-bold text-muted"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section>
            <h2 className="text-base font-bold">Today</h2>
            <button
              type="button"
              data-testid="reset-shuffles"
              onClick={() => setState((s) => (s ? resetShuffles(s) : s))}
              className="mt-3 rounded-lg bg-surface px-4 py-3 text-xs font-bold shadow-sm"
            >
              Reset today&apos;s shuffles
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
