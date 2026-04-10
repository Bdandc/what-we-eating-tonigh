"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  type AppState,
  type Meal,
  type MealType,
  appSurface,
  getMergedMeals,
  loadInitialState,
  mealLookup,
  memberColors,
  slugify,
  storageKey,
  todayStamp,
} from "@/lib/dinner-state";

function MemberChip({ member }: { member: { id: string; name: string; color: string } }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${member.color}1f`, color: member.color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: member.color }} />
      {member.name}
    </span>
  );
}

export default function MealsPage() {
  const [appState, setAppState] = useState<AppState>(loadInitialState);
  const [formType, setFormType] = useState<MealType>("family");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);

  const lookup = useMemo(() => mealLookup(appState), [appState]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(appState));
  }, [appState]);

  function getMealMembers(mealId: string) {
    const memberIds = appState.mealLikes[mealId] ?? [];
    return appState.familyMembers.filter((m) => memberIds.includes(m.id));
  }

  function resetMealForm() {
    setEditingMealId(null);
    setFormType("family");
    setFormName("");
    setFormDescription("");
    setSelectedMemberIds([]);
  }

  function saveMeal() {
    const trimmedName = formName.trim();
    const trimmedDescription = formDescription.trim();

    if (!trimmedName || !trimmedDescription) return;

    const baseId = (editingMealId ?? slugify(trimmedName)) || `meal-${Date.now()}`;
    let nextId = baseId;
    let counter = 2;

    while (lookup[formType][nextId] && nextId !== editingMealId) {
      nextId = `${baseId}-${counter}`;
      counter += 1;
    }

    const nextMeal: Meal = { id: nextId, name: trimmedName, description: trimmedDescription };

    startTransition(() => {
      setAppState((current) => {
        const existing = current.customMeals[formType].filter((m) => m.id !== nextId);
        return {
          ...current,
          customMeals: { ...current.customMeals, [formType]: [nextMeal, ...existing] },
          mealLikes: { ...current.mealLikes, [nextId]: selectedMemberIds },
        };
      });
    });

    resetMealForm();
  }

  function startEditingMeal(mealType: MealType, meal: Meal) {
    setEditingMealId(meal.id);
    setFormType(mealType);
    setFormName(meal.name);
    setFormDescription(meal.description);
    setSelectedMemberIds(appState.mealLikes[meal.id] ?? []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteMeal(mealType: MealType, mealId: string) {
    startTransition(() => {
      setAppState((current) => {
        const { [mealId]: _removed, ...remainingLikes } = current.mealLikes;
        return {
          ...current,
          lastUpdated: todayStamp(),
          customMeals: {
            ...current.customMeals,
            [mealType]: current.customMeals[mealType].filter((m) => m.id !== mealId),
          },
          mealLikes: remainingLikes,
        };
      });
    });
  }

  return (
    <div className="min-h-screen pb-28 text-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6 sm:px-6">

        {/* Back nav */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition motion-safe:hover:-translate-x-0.5"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back to planner
        </Link>

        {/* Header */}
        <header className={cn(appSurface(), "p-7")}>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-accent-deep">Meal library</p>
          <h1 className="font-display text-4xl leading-none sm:text-5xl">Meals</h1>
          <p className="mt-3 text-base leading-7 text-muted">Add your family favourites and edit what&apos;s already in the library.</p>
        </header>

        {/* Add / edit form */}
        <section className={cn(appSurface(true), "p-6")}>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl leading-none">{editingMealId ? "Edit meal" : "Add a meal"}</h2>
            {editingMealId && (
              <button type="button" onClick={resetMealForm} className="text-sm font-semibold text-muted">
                Cancel
              </button>
            )}
          </div>
          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-accent-deep">
              Meal type
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as MealType)}
                className="h-12 rounded-2xl border border-[rgba(103,73,44,0.14)] bg-white px-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1"
              >
                <option value="family">Family meal</option>
                <option value="kids">Kids meal</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-accent-deep">
              Meal name
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Pizza wraps"
                className="h-12 rounded-2xl border border-[rgba(103,73,44,0.14)] bg-white px-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-accent-deep">
              Short description
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Quick, easy, and always gets eaten."
                className="min-h-24 rounded-2xl border border-[rgba(103,73,44,0.14)] bg-white px-4 py-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1"
              />
            </label>
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-accent-deep">Who likes this?</p>
              <div className="flex flex-wrap gap-2">
                {appState.familyMembers.map((member) => {
                  const active = selectedMemberIds.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() =>
                        setSelectedMemberIds((current) =>
                          current.includes(member.id)
                            ? current.filter((id) => id !== member.id)
                            : [...current, member.id],
                        )
                      }
                      className={cn(
                        "min-h-11 rounded-full border px-3 py-2 text-sm font-semibold transition",
                        active ? "border-transparent text-white" : "border-[rgba(103,73,44,0.12)] bg-white text-foreground",
                      )}
                      style={active ? { backgroundColor: member.color } : undefined}
                    >
                      {member.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              type="button"
              onClick={saveMeal}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-[#fff8f3] shadow-[0_14px_24px_rgba(143,52,27,0.2)] transition motion-safe:hover:-translate-y-0.5"
            >
              {editingMealId ? "Save changes" : "Add to library"}
            </button>
          </div>
        </section>

        {/* Meal lists */}
        {(["family", "kids"] as MealType[]).map((type) => (
          <section key={type} className={cn(appSurface(), "p-6")}>
            <h2 className="mb-5 font-display text-2xl leading-none">{type === "family" ? "Family meals" : "Kids meals"}</h2>
            <div className="grid gap-3">
              {getMergedMeals(appState, type).map((meal) => {
                const isCustom = appState.customMeals[type].some((m) => m.id === meal.id);
                return (
                  <article key={meal.id} className="rounded-[18px] border border-[rgba(103,73,44,0.08)] bg-white/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-xl leading-none">{meal.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted">{meal.description}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingMeal(type, meal)}
                          className="rounded-full bg-[rgba(103,73,44,0.08)] px-3 py-2 text-xs font-semibold text-foreground transition motion-safe:hover:-translate-y-0.5"
                        >
                          Edit
                        </button>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => deleteMeal(type, meal.id)}
                            className="rounded-full bg-[rgba(200,92,61,0.08)] px-3 py-2 text-xs font-semibold text-accent-deep transition motion-safe:hover:-translate-y-0.5"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    {getMealMembers(meal.id).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {getMealMembers(meal.id).map((member) => (
                          <MemberChip key={`${meal.id}-${member.id}`} member={member} />
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
