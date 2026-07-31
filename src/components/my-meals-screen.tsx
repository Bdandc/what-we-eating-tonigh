"use client";

import Link from "next/link";
import { useWawet } from "@/components/use-wawet";

const chevronLeft = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const chevronRight = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-muted">
    <path d="M9.5 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const plusSquare = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 8v8M8 12h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export function MyMealsScreen() {
  const [state] = useWawet();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-6 pb-10 pt-5">
      <header className="flex items-center justify-between">
        <Link href="/settings" aria-label="Back" className="-ml-1 p-1 text-foreground">
          {chevronLeft}
        </Link>
        <Link href="/meals/add" data-testid="add-meal" className="flex items-center gap-2 text-sm font-bold">
          Add item
          {plusSquare}
        </Link>
      </header>

      <h1 className="mt-8 text-[32px] font-bold">My Meals</h1>

      {!state ? (
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-white/70" />
      ) : state.customMeals.length === 0 ? (
        <p className="mt-8 text-sm text-muted" data-testid="no-meals">
          No meals yet. Add your first one and it joins the suggestions.
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {state.customMeals.map((meal) => (
            <li key={meal.id}>
              <Link
                href={`/meals/${meal.id}`}
                className="flex items-center justify-between rounded-xl bg-surface px-4 py-4 shadow-sm"
              >
                <span className="text-sm font-bold">
                  {meal.name}
                  <span className="ml-3 font-normal text-muted">
                    {meal.kind === "kids" ? "Kids" : "Family"}
                  </span>
                </span>
                {chevronRight}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
