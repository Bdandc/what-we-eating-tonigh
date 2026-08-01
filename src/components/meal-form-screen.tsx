"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  type Category,
  type Ingredient,
  type MealKind,
  seededIngredients,
} from "@/lib/wawet-data";
import {
  addCustomIngredient,
  addCustomMeal,
  removeCustomMeal,
  updateCustomMeal,
} from "@/lib/wawet-state";
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
  const [armedDelete, setArmedDelete] = useState(false);
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("protein");
  const [addError, setAddError] = useState<string | null>(null);

  const editing = state && mealId ? state.customMeals.find((m) => m.id === mealId) ?? null : null;

  // Prefill via state-adjustment-during-render (the React-endorsed pattern;
  // an effect here trips react-hooks/set-state-in-effect). Runs once per
  // mount - the page keys this component by meal id, so a different meal is
  // a fresh mount with fresh state.
  if (!loaded && state && mealId) {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description);
      setKind(editing.kind);
      setIngredients(editing.ingredients);
    }
    setLoaded(true);
  }

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
    // Deletion is unrecoverable in a localStorage app: first tap arms,
    // second tap within the armed state deletes.
    if (!armedDelete) {
      setArmedDelete(true);
      return;
    }
    setState(removeCustomMeal(state, mealId));
    router.push("/meals");
  }

  // Every item, seeded and custom, grouped like the pantry so nothing is
  // buried in one long chip wall. The search narrows across all groups.
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: [
        ...seededIngredients.filter((i) => i.category === cat.id),
        ...(state?.customIngredients ?? []).filter((i) => i.category === cat.id),
      ].filter((i) => q === "" || i.name.toLowerCase().includes(q)) as Ingredient[],
    })).filter((group) => group.items.length > 0);
  }, [state, query]);

  function openSheet() {
    setNewName("");
    setAddError(null);
    dialogRef.current?.showModal();
  }

  function addItem() {
    if (!state) return;
    const result = addCustomIngredient(state, newName, newCategory);
    if (!result.ok) {
      setAddError(result.error);
      return;
    }
    const added = result.state.customIngredients[result.state.customIngredients.length - 1];
    setAddError(null);
    dialogRef.current?.close();
    setState(result.state);
    // The new item joins this meal's selection right away: that is why the
    // user reached for it mid-form.
    setIngredients((current) => [...current, added.id]);
  }

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
          <button
            type="button"
            aria-label={armedDelete ? "Tap again to delete" : "Delete meal"}
            data-testid="delete-meal"
            data-armed={armedDelete || undefined}
            onClick={remove}
            className={armedDelete ? "flex items-center gap-2 p-1 text-xs font-bold text-[#c0392b]" : "p-1 text-foreground"}
          >
            {armedDelete ? "Tap again to delete" : null}
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

        <div className="mt-6 flex items-center justify-between">
          <p className="text-lg font-bold">
            Needs{" "}
            <span className="text-sm font-normal text-muted">
              {ingredients.length > 0 ? `(${ingredients.length} selected)` : "(optional)"}
            </span>
          </p>
          <button
            type="button"
            data-testid="new-ingredient"
            onClick={openSheet}
            className="flex items-center gap-1 text-sm font-bold"
          >
            New item
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 8v8M8 12h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <input
          type="search"
          data-testid="ingredient-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search items"
          aria-label="Search items"
          className="mt-2 w-full rounded-lg border border-line bg-surface px-4 py-2.5 text-sm outline-none focus:border-green-deep"
        />
        {grouped.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Nothing matches. Add it as a new item instead.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            {grouped.map((group) => (
              <section key={group.id}>
                <h2 className="text-sm font-bold text-muted">{group.label}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {group.items.map((ing) => {
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
              </section>
            ))}
          </div>
        )}

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

      <dialog
        ref={dialogRef}
        aria-label="Add a new item"
        className="fixed inset-x-0 bottom-0 mt-auto w-full max-w-md rounded-t-3xl bg-surface p-6 backdrop:bg-black/35 [margin-inline:auto]"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <form
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            addItem();
          }}
        >
          <h2 className="text-[22px] font-bold">Add a new item</h2>

          <label htmlFor="new-ingredient-name" className="mt-5 block text-base font-bold">
            Name
          </label>
          <input
            id="new-ingredient-name"
            data-testid="new-ingredient-name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            autoFocus
            className="mt-2 w-full rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
          />
          {addError ? (
            <p data-testid="new-ingredient-error" className="mt-2 text-xs font-bold text-[#c0392b]">
              {addError}
            </p>
          ) : null}

          <p className="mt-5 text-base font-bold">Category</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="radio"
                aria-checked={newCategory === cat.id}
                onClick={() => setNewCategory(cat.id)}
                className={
                  newCategory === cat.id
                    ? "rounded-lg border border-green-deep bg-green-light px-4 py-3 text-xs font-bold"
                    : "rounded-lg border border-line bg-surface px-4 py-3 text-xs font-bold shadow-sm"
                }
              >
                {cat.label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted">
            It joins your pantry and gets selected for this meal.
          </p>

          <button
            type="submit"
            data-testid="save-new-ingredient"
            className="mt-5 w-full rounded-lg bg-green-deep py-3.5 text-sm font-bold text-white"
          >
            Save
          </button>
        </form>
      </dialog>
    </main>
  );
}
