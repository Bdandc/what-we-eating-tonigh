"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type MealKind, seededIngredients } from "@/lib/wawet-data";
import { addCustomMeal } from "@/lib/wawet-state";
import { useWawet } from "@/components/use-wawet";

const chevronLeft = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function AddMealScreen() {
  const [state, setState] = useWawet();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<MealKind>("family");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!state) return;
    // Deliberately outside the state updater: router.push schedules a React
    // update of its own, and updaters must stay side-effect free.
    const result = addCustomMeal(state, { name, description, kind, ingredients });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setState(result.state);
    router.push("/settings");
  }

  const pantryItems = [...seededIngredients, ...(state?.customIngredients ?? [])];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-28 pt-5">
      <header className="flex items-center">
        <Link href="/settings" aria-label="Back" className="-ml-1 p-1 text-foreground">
          {chevronLeft}
        </Link>
      </header>

      <h1 className="mt-6 text-[22px] font-bold">Add a meal</h1>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <label htmlFor="meal-name" className="mt-6 block text-base font-bold">
          Name
        </label>
        <input
          id="meal-name"
          data-testid="meal-name-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-2 w-full rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
        />
        {error ? (
          <p data-testid="meal-error" className="mt-2 text-xs font-bold text-[#c0392b]">
            {error}
          </p>
        ) : null}

        <label htmlFor="meal-description" className="mt-5 block text-base font-bold">
          Description <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="meal-description"
          data-testid="meal-description-input"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-2 w-full rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
        />

        <p className="mt-5 text-base font-bold">For</p>
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
                  ? "rounded-lg bg-green-deep px-4 py-3 text-xs font-bold text-white"
                  : "rounded-lg bg-surface px-4 py-3 text-xs font-bold shadow-sm outline outline-1 outline-line"
              }
            >
              {option === "family" ? "Family" : "Kids"}
            </button>
          ))}
        </div>

        <p className="mt-5 text-base font-bold">
          Needs <span className="font-normal text-muted">(from your pantry, optional)</span>
        </p>
        {/* No height cap here: the page scrolls, so the chips wrap freely
            instead of being trapped in a nested scroller. */}
        <div className="mt-2 flex flex-wrap gap-2">
          {pantryItems.map((ing) => {
            const selected = ingredients.includes(ing.id);
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
                    ? "rounded-lg bg-green-deep px-3 py-2 text-xs font-bold text-white"
                    : "rounded-lg bg-surface px-3 py-2 text-xs font-bold shadow-sm outline outline-1 outline-line"
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
