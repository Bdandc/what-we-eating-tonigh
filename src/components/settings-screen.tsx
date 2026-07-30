"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { type MealKind, type Weekday, WEEKDAYS, seededIngredients } from "@/lib/wawet-data";
import {
  addCustomMeal,
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
  const mealDialogRef = useRef<HTMLDialogElement>(null);
  const [mealName, setMealName] = useState("");
  const [mealDescription, setMealDescription] = useState("");
  const [mealKind, setMealKind] = useState<MealKind>("family");
  const [mealIngredients, setMealIngredients] = useState<string[]>([]);
  const [mealError, setMealError] = useState<string | null>(null);

  function openMealSheet() {
    setMealName("");
    setMealDescription("");
    setMealKind("family");
    setMealIngredients([]);
    setMealError(null);
    mealDialogRef.current?.showModal();
  }

  function saveMeal() {
    setState((s) => {
      if (!s) return s;
      const result = addCustomMeal(s, {
        name: mealName,
        description: mealDescription,
        kind: mealKind,
        ingredients: mealIngredients,
      });
      if (!result.ok) {
        setMealError(result.error);
        return s;
      }
      setMealError(null);
      mealDialogRef.current?.close();
      return result.state;
    });
  }

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
                        ? "rounded-lg bg-foreground px-4 py-3 text-xs font-bold text-surface"
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
                  ? "relative h-7 w-12 rounded-full bg-foreground transition"
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
              <button type="button" data-testid="add-meal" onClick={openMealSheet} className="text-sm font-bold">
                Add a meal
              </button>
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

      <dialog
        ref={mealDialogRef}
        aria-label="Add a meal"
        className="fixed inset-x-0 bottom-0 mt-auto w-full max-w-md rounded-t-3xl bg-surface p-6 backdrop:bg-black/35 [margin-inline:auto]"
        onClick={(event) => {
          if (event.target === mealDialogRef.current) mealDialogRef.current?.close();
        }}
      >
        <form
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            saveMeal();
          }}
        >
          <h2 className="text-[22px] font-bold">Add a meal</h2>

          <label htmlFor="meal-name" className="mt-5 block text-base font-bold">
            Name
          </label>
          <input
            id="meal-name"
            data-testid="meal-name-input"
            value={mealName}
            onChange={(event) => setMealName(event.target.value)}
            autoFocus
            className="mt-2 w-full rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
          />
          {mealError ? (
            <p data-testid="meal-error" className="mt-2 text-xs font-bold text-[#c0392b]">
              {mealError}
            </p>
          ) : null}

          <label htmlFor="meal-description" className="mt-5 block text-base font-bold">
            Description <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="meal-description"
            data-testid="meal-description-input"
            value={mealDescription}
            onChange={(event) => setMealDescription(event.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
          />

          <p className="mt-5 text-base font-bold">For</p>
          <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Meal kind">
            {(["family", "kids"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={mealKind === kind}
                onClick={() => setMealKind(kind)}
                className={
                  mealKind === kind
                    ? "rounded-lg bg-foreground px-4 py-3 text-xs font-bold text-surface"
                    : "rounded-lg bg-surface px-4 py-3 text-xs font-bold shadow-sm outline outline-1 outline-line"
                }
              >
                {kind === "family" ? "Family" : "Kids"}
              </button>
            ))}
          </div>

          <p className="mt-5 text-base font-bold">
            Needs <span className="font-normal text-muted">(from your pantry, optional)</span>
          </p>
          <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
            {[...seededIngredients, ...(state?.customIngredients ?? [])].map((ing) => {
              const selected = mealIngredients.includes(ing.id);
              return (
                <button
                  key={ing.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    setMealIngredients((current) =>
                      selected ? current.filter((i) => i !== ing.id) : [...current, ing.id],
                    )
                  }
                  className={
                    selected
                      ? "rounded-lg bg-foreground px-3 py-2 text-xs font-bold text-surface"
                      : "rounded-lg bg-surface px-3 py-2 text-xs font-bold shadow-sm outline outline-1 outline-line"
                  }
                >
                  {ing.name}
                </button>
              );
            })}
          </div>

          <button
            type="submit"
            data-testid="save-meal"
            className="mt-5 w-full rounded-lg bg-accent py-3.5 text-sm font-bold text-white"
          >
            Save
          </button>
        </form>
      </dialog>
    </main>
  );
}
