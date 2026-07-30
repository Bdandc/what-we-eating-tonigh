"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  MAX_SHUFFLES,
  canShuffle,
  isFallback,
  isTakeawayToday,
  resolveMeal,
  restoreTakeaway,
  setView,
  shuffle,
  skipTakeaway,
  weekdayName,
} from "@/lib/wawet-state";
import { useWawet } from "@/components/use-wawet";

const gearIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const swapIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
    <path d="M4 8h13M14 4.5L17.5 8 14 11.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 16H7M10 12.5L6.5 16l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Skeleton() {
  return (
    <div className="mt-16 h-72 animate-pulse rounded-2xl bg-white/70" data-testid="today-skeleton" />
  );
}

export function TodayScreen() {
  const [state, setState] = useWawet();

  const takeawayActive = state ? isTakeawayToday(state) && !state.today.takeawaySkipped : false;
  const dark = takeawayActive;

  useEffect(() => {
    if (!state) return;
    document.body.classList.toggle("wawet-dark", dark);
    document.body.classList.toggle("wawet-light", !dark);
    return () => {
      document.body.classList.remove("wawet-dark", "wawet-light");
    };
  }, [state, dark]);

  return (
    <div className={dark ? "min-h-dvh w-full bg-green-deep text-white" : state ? "min-h-dvh w-full bg-green-light text-foreground" : "min-h-dvh w-full"}>
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-10 pt-5">
        <header className="flex items-center justify-end">
          <Link href="/settings" className="flex items-center gap-2 text-sm font-bold">
            Settings
            {gearIcon}
          </Link>
        </header>

        <h1 className="mt-8 text-[28px] font-bold leading-9">
          What are we eating
          <br />
          tonight?
        </h1>

        {!state ? (
          <Skeleton />
        ) : (
          <TodayCard state={state} setState={setState} takeawayActive={takeawayActive} />
        )}

        <footer className="mt-auto pt-16 text-center">
          <Link href="/pantry" className="text-xs font-bold underline underline-offset-2">
            Don&apos;t have the ingredients?
          </Link>
        </footer>
      </main>
    </div>
  );
}

function TodayCard({
  state,
  setState,
  takeawayActive,
}: {
  state: NonNullable<ReturnType<typeof useWawet>[0]>;
  setState: ReturnType<typeof useWawet>[1];
  takeawayActive: boolean;
}) {
  const takeawaySkippedToday = isTakeawayToday(state) && state.today.takeawaySkipped;
  const { view } = state.today;
  const meal = resolveMeal(
    state,
    view === "family" ? state.today.suggestionId : state.today.kidsSuggestionId,
  );
  const shuffleDisabled = !canShuffle(state);
  const fallback = isFallback(view, state.pantry, state.customMeals);

  if (takeawayActive) {
    return (
      <section className="mt-16">
        <article
          data-testid="today-card"
          data-variant="takeaway"
          className="flex min-h-72 flex-col justify-center rounded-2xl bg-surface p-6 text-foreground shadow-sm"
        >
          <h2 className="text-[32px] font-bold leading-10">
            Takeaway
            <br />
            {weekdayName()}
          </h2>
          <p className="mt-3 text-sm text-muted">Order what you want tonight.</p>
        </article>
        <button
          type="button"
          onClick={() => setState((s) => (s ? skipTakeaway(s) : s))}
          className="mt-6 rounded-lg bg-surface px-4 py-3 text-xs font-bold text-foreground shadow-sm"
        >
          Skip Takeaway tonight
        </button>
      </section>
    );
  }

  return (
    <section className="mt-16">
      <article
        data-testid="today-card"
        data-variant="normal"
        className="flex min-h-72 touch-pan-y flex-col rounded-2xl bg-surface p-6 text-foreground shadow-sm"
      >
        <div className="flex justify-end">
          <button
            type="button"
            disabled={shuffleDisabled}
            onClick={() => setState((s) => (s ? shuffle(s) : s))}
            className="flex items-center gap-1.5 text-xs font-bold disabled:text-muted"
            aria-label={shuffleDisabled ? "No shuffles left today" : "Shuffle suggestion"}
          >
            {swapIcon}
            Shuffle
            <span data-testid="shuffle-count" className="ml-0.5">
              {state.today.shufflesUsed}/{MAX_SHUFFLES}
            </span>
          </button>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <h2 data-testid="meal-name" className="text-[32px] font-bold leading-10">
            {meal?.name ?? "Dinner"}
          </h2>
          <p className="mt-4 text-xs leading-5 text-muted">{meal?.description}</p>
          {fallback ? (
            <p data-testid="fallback-notice" className="mt-3 text-xs text-muted">
              Nothing matches your pantry. Showing everything.
            </p>
          ) : null}
        </div>
      </article>

      <div className="mt-6 flex items-center gap-3">
        {state.settings.kidsEnabled ? (
          <button
            type="button"
            data-testid="kids-pill"
            onClick={() =>
              setState((s) => (s ? setView(s, s.today.view === "kids" ? "family" : "kids") : s))
            }
            className="rounded-lg border border-green-deep bg-transparent px-4 py-3 text-xs font-bold text-foreground"
          >
            {view === "kids" ? "Family suggestion" : "Kids suggestion"}
          </button>
        ) : null}
        {takeawaySkippedToday ? (
          <button
            type="button"
            onClick={() => setState((s) => (s ? restoreTakeaway(s) : s))}
            className="text-xs font-bold text-green-deep underline underline-offset-2"
          >
            It&apos;s takeaway day · Restore
          </button>
        ) : null}
      </div>
    </section>
  );
}
