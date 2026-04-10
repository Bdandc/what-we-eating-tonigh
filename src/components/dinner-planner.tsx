"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  type AppState,
  type FavoriteMealRow,
  type DaySettingRow,
  type FamilyMemberRow,
  type MealLikeRow,
  appSurface,
  getRandomMealId,
  getTodayName,
  initialDayState,
  loadInitialState,
  mealLookup,
  maxShuffles,
  mergeRemoteState,
  seededMealLikes,
  storageKey,
  todayStamp,
  weekPlan,
} from "@/lib/dinner-state";

type FamilyMember = {
  id: string;
  name: string;
  role: string;
  color: string;
};

function MemberChip({ member }: { member: FamilyMember }) {
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

const shuffleIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
    <path d="M17 3h4v4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M3 7h5l4 5 4 5h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M17 17h4v4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M3 17h5l2-2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M14 10l2-2h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

const householdSlug = process.env.NEXT_PUBLIC_SUPABASE_HOUSEHOLD_SLUG ?? "default";

export function DinnerPlanner() {
  const [appState, setAppState] = useState<AppState>(loadInitialState);
  const [syncStatus, setSyncStatus] = useState<"idle" | "loading" | "saving" | "error">("idle");

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const remoteHydratedRef = useRef(false);
  const firstPersistRef = useRef(true);

  const lookup = mealLookup(appState);
  const todayName = getTodayName();
  const todaysState = appState.days[todayName];
  const todaysMeal = todaysState ? lookup.family[todaysState.familyMealId] : null;

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(appState));
  }, [appState]);

  useEffect(() => {
    if (!supabase) {
      remoteHydratedRef.current = true;
      return;
    }

    const client = supabase;
    let isActive = true;

    async function loadRemoteState() {
      setSyncStatus("loading");

      const [favoritesResult, daysResult, membersResult, likesResult] = await Promise.all([
        client.from("favorite_meals").select("household_slug,meal_type,meal_key,name,description,created_at").eq("household_slug", householdSlug).order("created_at", { ascending: false }),
        client.from("day_settings").select("household_slug,day_name,family_meal_id,kids_meal_id,use_kids_meal,family_shuffles_used,kids_shuffles_used,updated_at").eq("household_slug", householdSlug),
        client.from("family_members").select("household_slug,member_key,name,role,color,created_at").eq("household_slug", householdSlug).order("created_at", { ascending: true }),
        client.from("meal_member_preferences").select("household_slug,meal_key,member_key,created_at").eq("household_slug", householdSlug),
      ]);

      if (!isActive) return;

      if (favoritesResult.error || daysResult.error || membersResult.error || likesResult.error) {
        setSyncStatus("error");
        remoteHydratedRef.current = true;
        return;
      }

      setAppState((current) =>
        mergeRemoteState(
          current,
          favoritesResult.data ?? [],
          daysResult.data ?? [],
          membersResult.data ?? [],
          likesResult.data ?? [],
        ),
      );
      remoteHydratedRef.current = true;
      setSyncStatus("idle");
    }

    void loadRemoteState();

    return () => {
      isActive = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !remoteHydratedRef.current) return;

    const client = supabase;

    if (firstPersistRef.current) {
      firstPersistRef.current = false;
      return;
    }

    let cancelled = false;

    async function persistRemoteState() {
      setSyncStatus("saving");

      const favoriteRows: FavoriteMealRow[] = (["family", "kids"] as const).flatMap((mealType) =>
        appState.customMeals[mealType].map((meal) => ({
          household_slug: householdSlug,
          meal_type: mealType,
          meal_key: meal.id,
          name: meal.name,
          description: meal.description,
        })),
      );

      const dayRows: DaySettingRow[] = Object.entries(appState.days).map(([dayName, state]) => ({
        household_slug: householdSlug,
        day_name: dayName,
        family_meal_id: state.familyMealId,
        kids_meal_id: state.kidsMealId,
        use_kids_meal: state.useKidsMeal,
        family_shuffles_used: state.familyShufflesUsed,
        kids_shuffles_used: state.kidsShufflesUsed,
      }));

      const memberRows: FamilyMemberRow[] = appState.familyMembers.map((member) => ({
        household_slug: householdSlug,
        member_key: member.id,
        name: member.name,
        role: member.role,
        color: member.color,
      }));

      const likeRows: MealLikeRow[] = Object.entries(appState.mealLikes).flatMap(([mealId, memberIds]) =>
        memberIds.map((memberId) => ({
          household_slug: householdSlug,
          meal_key: mealId,
          member_key: memberId,
        })),
      );

      const [favoritesResult, daysResult, membersResult, deleteLikesResult] = await Promise.all([
        favoriteRows.length > 0
          ? client.from("favorite_meals").upsert(favoriteRows, { onConflict: "household_slug,meal_type,meal_key" })
          : Promise.resolve({ error: null }),
        client.from("day_settings").upsert(dayRows, { onConflict: "household_slug,day_name" }),
        memberRows.length > 0
          ? client.from("family_members").upsert(memberRows, { onConflict: "household_slug,member_key" })
          : Promise.resolve({ error: null }),
        client.from("meal_member_preferences").delete().eq("household_slug", householdSlug),
      ]);

      let insertLikesResult: { error: unknown } = { error: null };

      if (!deleteLikesResult.error && likeRows.length > 0) {
        insertLikesResult = await client.from("meal_member_preferences").insert(likeRows);
      }

      if (cancelled) return;

      if (favoritesResult.error || daysResult.error || membersResult.error || deleteLikesResult.error || insertLikesResult.error) {
        setSyncStatus("error");
        return;
      }

      setSyncStatus("idle");
    }

    void persistRemoteState();

    return () => {
      cancelled = true;
    };
  }, [appState, supabase]);

  function getMealMembers(mealId: string) {
    const memberIds = appState.mealLikes[mealId] ?? [];
    return appState.familyMembers.filter((m) => memberIds.includes(m.id));
  }

  function updateDay(day: string, updater: (current: (typeof appState.days)[string]) => (typeof appState.days)[string]) {
    startTransition(() => {
      setAppState((current) => ({
        ...current,
        lastUpdated: todayStamp(),
        days: { ...current.days, [day]: updater(current.days[day]) },
      }));
    });
  }

  function resetShuffles() {
    startTransition(() => {
      setAppState((current) => ({
        ...current,
        lastUpdated: todayStamp(),
        days: initialDayState,
      }));
    });
  }

  return (
    <div className="min-h-screen pb-28 text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">

        <header className={cn(appSurface(), "overflow-hidden bg-[linear-gradient(180deg,rgba(255,250,244,0.98),rgba(252,240,229,0.88))] p-7")}>
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-accent-deep">Tonight&apos;s vibe</p>
              <h1 className="font-display text-4xl leading-none sm:text-5xl">{todaysMeal?.name ?? "Dinner idea"}</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted">
                {todaysMeal?.description ?? "Pick something easy tonight."}
              </p>
              {todaysMeal ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {getMealMembers(todaysMeal.id).map((member) => (
                    <MemberChip key={member.id} member={member} />
                  ))}
                </div>
              ) : null}
            </div>
            <div className="hidden rounded-full border border-[rgba(103,73,44,0.1)] bg-white/70 px-4 py-2 text-sm font-medium text-muted md:block">
              {syncStatus === "loading" && "Syncing"}
              {syncStatus === "saving" && "Saving"}
              {syncStatus === "error" && "Sync issue"}
              {syncStatus === "idle" && "Up to date"}
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-accent-deep">Weekly planner</p>
            <h2 className="font-display text-3xl leading-none sm:text-4xl">What we are eating this week</h2>
          </div>
          <button
            type="button"
            onClick={resetShuffles}
            className="inline-flex h-11 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-foreground shadow-[0_10px_24px_rgba(84,55,31,0.08)] transition motion-safe:hover:-translate-y-0.5"
          >
            Reset all shuffles
          </button>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {weekPlan.map((dayPlan) => {
            const state = appState.days[dayPlan.day];
            const familyMeal = lookup.family[state.familyMealId];
            const kidsMeal = lookup.kids[state.kidsMealId];
            const familyDisabled = state.familyShufflesUsed >= maxShuffles;
            const kidsDisabled = !state.useKidsMeal || state.kidsShufflesUsed >= maxShuffles;

            return (
              <article key={dayPlan.day} className={cn(appSurface(), "flex flex-col gap-5 rounded-[24px] p-6", dayPlan.day === todayName && "outline-2 outline-offset-0 outline-[rgba(200,92,61,0.28)]")}>

                <div className="flex items-center justify-end gap-2">
                  <span className="inline-flex items-center justify-center rounded-full bg-[rgba(200,92,61,0.10)] px-3 py-1.5 text-sm font-bold text-accent-deep">
                    {state.familyShufflesUsed}/{maxShuffles}
                  </span>
                  <button
                    type="button"
                    disabled={familyDisabled}
                    onClick={() =>
                      updateDay(dayPlan.day, (current) => ({
                        ...current,
                        familyMealId: getRandomMealId(
                          [...dayPlan.familyMealIds, ...appState.customMeals.family.map((m) => m.id)],
                          current.familyMealId,
                          appState.mealLikes,
                        ),
                        familyShufflesUsed: current.familyShufflesUsed + 1,
                      }))
                    }
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full transition",
                      familyDisabled
                        ? "cursor-not-allowed bg-[rgba(119,98,76,0.12)] text-[rgba(119,98,76,0.4)]"
                        : "bg-[rgba(200,92,61,0.10)] text-accent-deep motion-safe:hover:-translate-y-0.5",
                    )}
                    aria-label={familyDisabled ? "No family shuffles left" : "Shuffle family meal"}
                  >
                    {shuffleIcon}
                  </button>
                </div>

                <p className="font-display text-3xl leading-none">{dayPlan.day}</p>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-accent-deep">Family dinner</p>
                  <h3 className="font-display text-3xl leading-none tracking-tight sm:text-4xl">{familyMeal?.name ?? "Choose dinner"}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{familyMeal?.description}</p>
                  {familyMeal && getMealMembers(familyMeal.id).length > 0 && (
                    <div className="mt-4 flex -space-x-2.5">
                      {getMealMembers(familyMeal.id).map((member) => (
                        <div
                          key={member.id}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white text-sm font-bold text-white shadow-sm"
                          style={{ backgroundColor: member.color }}
                          title={member.name}
                        >
                          {member.name[0]}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent-deep">Kids dinner</p>
                    <label className="relative inline-flex h-7 w-12 cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={state.useKidsMeal}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          updateDay(dayPlan.day, (current) => ({ ...current, useKidsMeal: checked }));
                        }}
                        className="peer sr-only"
                      />
                      <span className="h-7 w-12 rounded-full bg-[rgba(119,98,76,0.2)] transition peer-checked:bg-accent" />
                      <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-[#fffaf4] shadow-[0_4px_10px_rgba(47,36,25,0.16)] transition peer-checked:translate-x-5" />
                    </label>
                  </div>

                  {state.useKidsMeal && (
                    <div className="mt-4">
                      <h3 className="font-display text-2xl leading-none tracking-tight sm:text-3xl">
                        {kidsMeal?.name ?? "Choose kids meal"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted">{kidsMeal?.description}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <span className="inline-flex items-center justify-center rounded-full bg-[rgba(200,92,61,0.10)] px-3 py-1.5 text-sm font-bold text-accent-deep">
                          {state.kidsShufflesUsed}/{maxShuffles}
                        </span>
                        <button
                          type="button"
                          disabled={kidsDisabled}
                          onClick={() =>
                            updateDay(dayPlan.day, (current) => ({
                              ...current,
                              kidsMealId: getRandomMealId(
                                [...dayPlan.kidsMealIds, ...appState.customMeals.kids.map((m) => m.id)],
                                current.kidsMealId,
                                appState.mealLikes,
                              ),
                              kidsShufflesUsed: current.kidsShufflesUsed + 1,
                            }))
                          }
                          className={cn(
                            "inline-flex h-9 w-9 items-center justify-center rounded-full transition",
                            kidsDisabled
                              ? "cursor-not-allowed bg-[rgba(119,98,76,0.12)] text-[rgba(119,98,76,0.4)]"
                              : "bg-[rgba(200,92,61,0.10)] text-accent-deep motion-safe:hover:-translate-y-0.5",
                          )}
                          aria-label={kidsDisabled ? "No kids shuffles left" : "Shuffle kids meal"}
                        >
                          {shuffleIcon}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#2f2419] px-2 py-2 shadow-[0_18px_32px_rgba(47,36,25,0.22)]">
          <Link
            href="/meals"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#fff8f3] transition motion-safe:hover:-translate-y-0.5"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs">🍽</span>
            Meals
          </Link>
          <span className="h-4 w-px bg-white/20" />
          <Link
            href="/family"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#fff8f3] transition motion-safe:hover:-translate-y-0.5"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs">👨‍👩‍👧</span>
            Family
          </Link>
        </div>
      </nav>
    </div>
  );
}
