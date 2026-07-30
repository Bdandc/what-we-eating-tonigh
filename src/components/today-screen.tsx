"use client";

import Link from "next/link";
import { mealById } from "@/lib/wawet-data";
import {
  MAX_SHUFFLES,
  canShuffle,
  isFallback,
  isTakeawayToday,
  restoreTakeaway,
  setView,
  shuffle,
  skipTakeaway,
  weekdayName,
} from "@/lib/wawet-state";
import { useWawet } from "@/components/use-wawet";

const helpIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.9c-.7.3-1 .8-1 1.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16.6" r="1.1" fill="currentColor" />
  </svg>
);

const chevronLeft = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
    <path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Skeleton() {
  return (
    <div className="mt-16 h-72 animate-pulse rounded-2xl bg-white/70" data-testid="today-skeleton" />
  );
}

export function TodayScreen() {
  const [state, setState] = useWawet();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-5">
      <header className="flex items-center justify-end">
        <Link
          href="/settings"
          className="flex items-center gap-2 text-sm font-bold text-foreground"
        >
          {helpIcon}
          Settings
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
        <TodayCard state={state} setState={setState} />
      )}

      <footer className="mt-auto pt-16 text-center">
        <Link href="/pantry" className="text-xs font-bold text-foreground underline-offset-2 hover:underline">
          Don&apos;t have the ingredients?
        </Link>
      </footer>
    </main>
  );
}

function TodayCard({
  state,
  setState,
}: {
  state: NonNullable<ReturnType<typeof useWawet>[0]>;
  setState: ReturnType<typeof useWawet>[1];
}) {
  const takeawayActive = isTakeawayToday(state) && !state.today.takeawaySkipped;
  const takeawaySkippedToday = isTakeawayToday(state) && state.today.takeawaySkipped;
  const { view } = state.today;
  const meal =
    mealById[view === "family" ? state.today.suggestionId : state.today.kidsSuggestionId];
  const shuffleDisabled = !canShuffle(state);
  const fallback = isFallback(view, state.pantry);

  if (takeawayActive) {
    return (
      <section className="mt-16">
        <article
          data-testid="today-card"
          data-variant="takeaway"
          className="flex min-h-72 flex-col justify-center rounded-2xl border-2 border-foreground/60 bg-[#d9d9d9] p-6"
        >
          <h2 className="text-[32px] font-bold leading-10">
            Takeaway
            <br />
            {weekdayName()}
          </h2>
          <p className="mt-3 text-sm text-foreground/70">Order what you want tonight.</p>
        </article>
        <button
          type="button"
          onClick={() => setState((s) => (s ? skipTakeaway(s) : s))}
          className="mt-6 rounded-lg bg-surface px-4 py-3 text-xs font-bold shadow-sm"
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
        className="flex min-h-72 flex-col rounded-2xl bg-surface p-6 shadow-sm"
      >
        <div className="flex justify-end">
          <button
            type="button"
            disabled={shuffleDisabled}
            onClick={() => setState((s) => (s ? shuffle(s) : s))}
            className="flex items-center gap-1 text-xs font-bold disabled:text-muted"
            aria-label={shuffleDisabled ? "No shuffles left today" : "Shuffle suggestion"}
          >
            {chevronLeft}
            Shuffle
            <span data-testid="shuffle-count" className="ml-1">
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
            className="rounded-lg bg-surface px-4 py-3 text-xs font-bold shadow-sm"
          >
            {view === "kids" ? "Family suggestion" : "Kids suggestion"}
          </button>
        ) : null}
        {takeawaySkippedToday ? (
          <button
            type="button"
            onClick={() => setState((s) => (s ? restoreTakeaway(s) : s))}
            className="text-xs font-bold text-muted underline-offset-2 hover:underline"
          >
            It&apos;s takeaway day · Restore
          </button>
        ) : null}
      </div>
    </section>
  );
}
