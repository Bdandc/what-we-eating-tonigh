"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  type Category,
  type Ingredient,
  CATEGORIES,
  seededIngredients,
} from "@/lib/wawet-data";
import { addCustomIngredient, togglePantry } from "@/lib/wawet-state";
import { useWawet } from "@/components/use-wawet";

const CHIP_LIMIT = 8;

const chevronLeft = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function PantryScreen() {
  const [state, setState] = useWawet();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("protein");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    if (!state) return [];
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: [
        ...seededIngredients.filter((i) => i.category === cat.id),
        ...state.customIngredients.filter((i) => i.category === cat.id),
      ] as Ingredient[],
    }));
  }, [state]);

  function openSheet() {
    setName("");
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeSheet() {
    dialogRef.current?.close();
  }

  function save() {
    setState((s) => {
      if (!s) return s;
      const result = addCustomIngredient(s, name, category);
      if (!result.ok) {
        setError(result.error);
        return s;
      }
      setError(null);
      closeSheet();
      return result.state;
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-5">
      <header className="flex items-center justify-between">
        <Link href="/" aria-label="Back" className="-ml-1 p-1 text-foreground">
          {chevronLeft}
        </Link>
        <button type="button" data-testid="add-item" onClick={openSheet} className="text-sm font-bold">
          Add item
        </button>
      </header>

      <h1 className="mt-6 text-[22px] font-bold">What do you have?</h1>

      {!state ? (
        <div className="mt-8 h-72 animate-pulse rounded-2xl bg-white/70" />
      ) : (
        <div className="mt-6 flex flex-col gap-7">
          {grouped.map((group) => {
            const isOpen = expanded[group.id] === true;
            const visible = isOpen ? group.items : group.items.slice(0, CHIP_LIMIT);
            return (
              <section key={group.id}>
                <h2 className="text-base font-bold">{group.label}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {visible.map((item) => {
                    const have = state.pantry[item.id] !== false;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-testid={`chip-${item.id}`}
                        aria-pressed={have}
                        onClick={() => setState((s) => (s ? togglePantry(s, item.id) : s))}
                        className={
                          have
                            ? "rounded-lg bg-surface px-4 py-3 text-xs font-bold shadow-sm"
                            : "rounded-lg bg-transparent px-4 py-3 text-xs font-bold text-muted outline outline-1 outline-line"
                        }
                      >
                        {item.name}
                      </button>
                    );
                  })}
                  {group.items.length > CHIP_LIMIT && !isOpen ? (
                    <button
                      type="button"
                      onClick={() => setExpanded((e) => ({ ...e, [group.id]: true }))}
                      className="px-2 py-3 text-xs font-bold text-muted underline-offset-2 hover:underline"
                    >
                      See more
                    </button>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-label="Add a new item"
        className="fixed inset-x-0 bottom-0 mt-auto w-full max-w-md rounded-t-3xl bg-surface p-6 backdrop:bg-black/35 [margin-inline:auto]"
        onClick={(event) => {
          if (event.target === dialogRef.current) closeSheet();
        }}
      >
        <form
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <h2 className="text-[22px] font-bold">Add a new item</h2>

          <label htmlFor="ingredient-name" className="mt-5 block text-base font-bold">
            Name
          </label>
          <input
            id="ingredient-name"
            data-testid="ingredient-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            className="mt-2 w-full rounded-lg border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-accent"
          />
          {error ? (
            <p data-testid="ingredient-error" className="mt-2 text-xs font-bold text-[#c0392b]">
              {error}
            </p>
          ) : null}

          <p className="mt-5 text-base font-bold">Category</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="radio"
                aria-checked={category === cat.id}
                onClick={() => setCategory(cat.id)}
                className={
                  category === cat.id
                    ? "rounded-lg bg-foreground px-4 py-3 text-xs font-bold text-surface"
                    : "rounded-lg bg-surface px-4 py-3 text-xs font-bold shadow-sm outline outline-1 outline-line"
                }
              >
                {cat.label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted">
            Your own items can be used by meals you add in Settings.
          </p>

          <button
            type="submit"
            data-testid="save-ingredient"
            className="mt-5 w-full rounded-lg bg-accent py-3.5 text-sm font-bold text-white"
          >
            Save
          </button>
        </form>
      </dialog>
    </main>
  );
}
