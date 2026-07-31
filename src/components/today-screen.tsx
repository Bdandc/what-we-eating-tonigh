"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  MAX_SHUFFLES,
  canShuffle,
  isTakeawayToday,
  mealMatchesPantry,
  peekNextSuggestion,
  resolveMeal,
  restoreTakeaway,
  setView,
  shuffle,
  skipTakeaway,
  weekdayName,
} from "@/lib/wawet-state";
import { useWawet } from "@/components/use-wawet";
import { type ReleasePose, useSwipeShuffle } from "@/components/use-swipe-shuffle";
import { useCardDeck } from "@/components/use-card-deck";

const DECK_LIFT = 10;
const DECK_SCALE = 0.965;
const DECK_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const REST_POSE: ReleasePose = { x: 0, rotation: 0, progress: 0 };

const gearIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.4 1a7.7 7.7 0 0 0-2.6-1.5L14 2.6h-4l-.4 2.5a7.7 7.7 0 0 0-2.6 1.5l-2.4-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.4-1a7.7 7.7 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5a7.7 7.7 0 0 0 2.6-1.5l2.4 1 2-3.4Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
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
  // The notice belongs to the CARD, not the pool: it shows whenever the dealt
  // meal itself does not match the pantry (empty eligible pool, a deal that
  // extended past a one-meal pool, or a migrated state).
  const offPantry = meal ? !mealMatchesPantry(state.pantry, meal) : false;
  const nextMeal = peekNextSuggestion(state);
  const { outgoing, throwCard, clearOutgoing } = useCardDeck<NonNullable<typeof meal>>();
  const { setCard, setDeck, cardRef, handlers: swipeHandlers } = useSwipeShuffle(
    !shuffleDisabled,
    (direction, release) => doShuffle(direction, release),
  );

  /** Throw the top card from wherever it was released and promote the riser. */
  function doShuffle(direction: "left" | "right", release: ReleasePose) {
    throwCard(meal, direction, release);
    setState((s) => (s ? shuffle(s) : s));
    // The stable card element rises from the under-card's CURRENT pose into
    // the top slot (WAAPI: no remount, keyboard focus survives). Content has
    // already swapped to the dealt meal by the time this frame paints, and it
    // is the same meal the under-card was showing - full continuity.
    const el = cardRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const p = release.progress;
    el.animate(
      [
        {
          transform: `translateY(${DECK_LIFT * (1 - p)}px) scale(${DECK_SCALE + (1 - DECK_SCALE) * p})`,
          opacity: String(0.55 + 0.45 * p),
        },
        { transform: "none", opacity: "1" },
      ],
      { duration: 260, easing: DECK_EASE },
    );
  }

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
      <div className="card-deck" ref={setDeck}>
        <div aria-hidden className="card-ghost card-ghost-2" />
        {nextMeal ? (
          <article
            aria-hidden
            className="card-ghost card-ghost-1 flex flex-col overflow-hidden p-6 text-foreground"
          >
            <div className="flex justify-end">
              <span className="flex items-center gap-1.5 text-xs font-bold">
                {swapIcon}
                Shuffle
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <h2 className="text-[32px] font-bold leading-10">{nextMeal.name}</h2>
              <p className="mt-4 text-xs leading-5 text-muted">{nextMeal.description}</p>
            </div>
          </article>
        ) : (
          <div aria-hidden className="card-ghost card-ghost-1" />
        )}

        {outgoing ? (
          <article
            key={outgoing.seq}
            aria-hidden
            onAnimationEnd={clearOutgoing}
            style={{
              "--out-x": `${outgoing.pose.x}px`,
              "--out-rot": `${outgoing.pose.rotation}deg`,
            } as React.CSSProperties}
            className={`card-out card-out-${outgoing.direction} flex min-h-72 flex-col rounded-2xl bg-surface p-6 text-foreground shadow-sm`}
          >
            <div className="flex justify-end">
              <span className="flex items-center gap-1.5 text-xs font-bold">
                {swapIcon}
                Shuffle
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <h2 className="text-[32px] font-bold leading-10">{outgoing.item.name}</h2>
              <p className="mt-4 text-xs leading-5 text-muted">{outgoing.item.description}</p>
            </div>
          </article>
        ) : null}

        <article
          ref={setCard}
          {...swipeHandlers}
          data-testid="today-card"
          data-variant="normal"
          className="card-live flex min-h-72 touch-pan-y flex-col rounded-2xl bg-surface p-6 text-foreground shadow-sm"
        >
          <div className="flex justify-end">
            <button
              type="button"
              disabled={shuffleDisabled}
              onClick={() => doShuffle("left", REST_POSE)}
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
            {offPantry ? (
              <p data-testid="fallback-notice" className="mt-3 text-xs text-muted">
                Not everything for this is in your pantry.
              </p>
            ) : null}
          </div>
        </article>
      </div>

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
