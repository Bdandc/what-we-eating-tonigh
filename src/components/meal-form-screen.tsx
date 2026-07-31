"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MealKind, seededIngredients } from "@/lib/wawet-data";
import { addCustomMeal, removeCustomMeal, updateCustomMeal } from "@/lib/wawet-state";
import { useWawet } from "@/components/use-wawet";

const chevronLeft = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const trashIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path d="M4.5 6.5h15M9.5 6V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V6M7 6.5l.8 13a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4l.8-13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 10.5v6M14 10.5v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

/** Shared by /meals/add (no mealId) and /meals/[id] (edit + delete). */
export function MealFormScreen({ mealId }: { mealId?: string }) {
  const [state, setState] = useWawet();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<MealKind>("family");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const editing = state && mealId ? state.customMeals.find((m) => m.id === mealId) ?? null : null;

  // Pre-fill once when editing; state arrives after mount.
  useEffect(() => {
    if (loaded || !state || !mealId) return;
    const meal = state.customMeals.find((m) => m.id === mealId);
    if (meal) {
      setName(meal.name);
      setDescription(meal.description);
      setKind(meal.kind);
      setIngredients(meal.ingredients);
    }
    setLoaded(true);
  }, [loaded, state, mealId]);

  function save() {
    if (!state) return;
    // Outside the updater: router.push schedules its own React update.
    const result = mealId
      ? updateCustomMeal(state, mealId, { name, description, kind, ingredients })
      : addCustomMeal(state, { name, description, kind, ingredients });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setState(result.state);
    router.push("/meals");
  }

  function remove() {
    if (!state || !mealId) return;
    setState(removeCustomMeal(state, mealId));
    router.push("/meals");
  }

  const pantryItems = [...seededIngredients, ...(state?.customIngredients ?? [])];

  // No interactive form before hydration (and, when editing, before the
  // prefill landed): early keystrokes or a premature Save must never vanish.
  if (!state || (mealId && !loaded)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pt-5">
        <header className="flex items-center">
          <Link href="/meals" aria-label="Back" className="-ml-1 p-1 text-foreground">
            {chevronLeft}
          </Link>
        </header>
        <div className="mt-10 h-72 animate-pulse rounded-2xl bg-white/70" />
      </main>
    );
  }

  if (mealId && !editing) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pt-5">
        <header className="flex items-center">
          <Link href="/meals" aria-label="Back" className="-ml-1 p-1 text-foreground">
            {chevronLeft}
          </Link>
        </header>
        <p className="mt-10 text-sm text-muted">That meal no longer exists.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-28 pt-5">
      <header className="flex items-center justify-between">
        <Link href="/meals" aria-label="Back" className="-ml-1 p-1 text-foreground">
          {chevronLeft}
        </Link>
        {mealId ? (
          <button type="button" aria-label="Delete meal" data-testid="delete-meal" onClick={remove} className="p-1 text-foreground">
            {trashIcon}
          </button>
        ) : null}
      </header>

      <h1 className="mt-8 text-[32px] font-bold">{mealId ? "Edit meal" : "Add meal"}</h1>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <label htmlFor="meal-name" className="mt-6 block text-lg font-bold">
          Name
        </label>
        <input
          id="meal-name"
          data-testid="meal-name-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-lg border border-green-deep/50 bg-surface px-4 py-3 text-sm outline-none focus:border-green-deep"
        />
        {error ? (
          <p data-testid="meal-error" className="mt-2 text-xs font-bold text-[#c0392b]">
            {error}
          </p>
        ) : null}

        <label htmlFor="meal-description" className="mt-5 block text-lg font-bold">
          Description <span className="text-sm font-normal text-muted">(optional)</span>
        </label>
        <input
          id="meal-description"
          data-testid="meal-description-input"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-2 w-full rounded-lg border border-green-deep/50 bg-surface px-4 py-3 text-sm outline-none focus:border-green-deep"
        />

        <p className="mt-6 text-lg font-bold">For</p>
        <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Meal kind">
          {(["family", "kids"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={kind === option}
              onClick={() => setKind(option)}
              className={
                kind === option
                  ? "rounded-lg border border-green-deep bg-green-light px-4 py-3 text-xs font-bold"
                  : "rounded-lg bg-surface px-4 py-3 text-xs font-bold shadow-sm"
              }
            >
              {option === "family" ? "Family" : "Kids"}
            </button>
          ))}
        </div>

        <p className="mt-6 text-lg font-bold">
          Needs <span className="text-sm font-normal text-muted">(from your pantry, optional)</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {pantryItems.map((ing) => {
            const selected = ingredients.includes(ing.id);
            const inPantry = state?.pantry[ing.id] === true;
            return (
              <button
                key={ing.id}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  setIngredients((current) =>
                    selected ? current.filter((i) => i !== ing.id) : [...current, ing.id],
                  )
                }
                className={
                  selected
                    ? "rounded-lg border border-green-deep bg-green-light px-3 py-2 text-xs font-bold"
                    : inPantry
                      ? "rounded-lg bg-surface px-3 py-2 text-xs font-bold shadow-sm"
                      : "rounded-lg bg-surface px-3 py-2 text-xs font-bold text-muted shadow-sm"
                }
              >
                {ing.name}
              </button>
            );
          })}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-10 mx-auto w-full max-w-md border-t border-line bg-surface px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          <button
            type="submit"
            data-testid="save-meal"
            className="w-full rounded-lg bg-green-deep py-3.5 text-sm font-bold text-white"
          >
            Save
          </button>
        </div>
      </form>
    </main>
  );
}
