"use client";

import Link from "next/link";
import { buildRecipeView } from "@/lib/recipe-view";
import { useWawet } from "@/components/use-wawet";

const chevronLeft = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const tick = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Shared by every entry point; backHref comes from the server page's fixed
 * allowlist, never from user input. */
export function RecipeScreen({ mealId, backHref }: { mealId: string; backHref: string }) {
  const [state] = useWawet();

  if (!state) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pt-5">
        <header className="flex items-center">
          <Link href={backHref} aria-label="Back" className="-ml-1 p-1 text-foreground">
            {chevronLeft}
          </Link>
        </header>
        <div className="mt-10 h-72 animate-pulse rounded-2xl bg-white/70" />
      </main>
    );
  }

  const view = buildRecipeView(state, mealId);

  if (!view) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pt-5">
        <header className="flex items-center">
          <Link href={backHref} aria-label="Back" className="-ml-1 p-1 text-foreground">
            {chevronLeft}
          </Link>
        </header>
        <p className="mt-10 text-sm text-muted">That meal no longer exists.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-5">
      <header className="flex items-center">
        <Link href={backHref} aria-label="Back" data-testid="recipe-back" className="-ml-1 p-1 text-foreground">
          {chevronLeft}
        </Link>
      </header>

      <h1 className="mt-8 text-[32px] font-bold leading-tight">{view.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {view.kind === "kids" ? "Kids" : "Family"}
        {view.serves ? ` · Serves ${view.serves}` : ""}
        {view.time ? ` · ${view.time}` : ""}
      </p>

      {view.ingredients.length > 0 ? (
        <>
          <h2 className="mt-7 text-base font-bold">You need</h2>
          <ul className="mt-2 flex flex-col gap-1.5" data-testid="recipe-ingredients">
            {view.ingredients.map((ing) => (
              <li key={ing.name} className="flex items-center gap-2 text-sm">
                <span
                  className={
                    ing.inPantry
                      ? "flex h-5 w-5 items-center justify-center rounded-md bg-green-light text-green-deep"
                      : "flex h-5 w-5 items-center justify-center rounded-md bg-surface text-muted shadow-sm"
                  }
                  aria-hidden="true"
                >
                  {ing.inPantry ? tick : null}
                </span>
                {ing.name}
                {!ing.inPantry ? <span className="text-xs text-muted">not in your pantry</span> : null}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Plus the usual cupboard things: oil, butter, onions, garlic, stock, spices.
          </p>
        </>
      ) : null}

      {view.steps.length > 0 ? (
        <>
          <h2 className="mt-7 text-base font-bold">How to cook it</h2>
          <ol className="mt-2 flex flex-col gap-3" data-testid="recipe-steps">
            {view.steps.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm leading-relaxed">
                <span className="font-bold text-green-deep">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="mt-7 text-sm text-muted" data-testid="recipe-own-meal">
          Your own meal. You know how you like it.
          {view.editHref ? (
            <>
              {" "}
              <Link href={view.editHref} className="font-bold underline">
                Edit meal
              </Link>
            </>
          ) : null}
        </p>
      )}
    </main>
  );
}
