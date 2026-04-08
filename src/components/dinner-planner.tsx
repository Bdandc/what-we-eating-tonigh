"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type MealType = "family" | "kids";

type Meal = {
  id: string;
  name: string;
  description: string;
};

type FamilyMember = {
  id: string;
  name: string;
  role: string;
  color: string;
};

type DayPlan = {
  day: string;
  familyMealIds: string[];
  kidsMealIds: string[];
};

type DayState = {
  familyMealId: string;
  kidsMealId: string;
  useKidsMeal: boolean;
  familyShufflesUsed: number;
  kidsShufflesUsed: number;
};

type AppState = {
  lastUpdated: string;
  customMeals: Record<MealType, Meal[]>;
  days: Record<string, DayState>;
  familyMembers: FamilyMember[];
  mealLikes: Record<string, string[]>;
};

type FavoriteMealRow = {
  household_slug: string;
  meal_type: MealType;
  meal_key: string;
  name: string;
  description: string;
  created_at?: string;
};

type DaySettingRow = {
  household_slug: string;
  day_name: string;
  family_meal_id: string;
  kids_meal_id: string;
  use_kids_meal: boolean;
  family_shuffles_used: number;
  kids_shuffles_used: number;
  updated_at?: string;
};

type FamilyMemberRow = {
  household_slug: string;
  member_key: string;
  name: string;
  role: string;
  color: string;
  created_at?: string;
};

type MealLikeRow = {
  household_slug: string;
  meal_key: string;
  member_key: string;
  created_at?: string;
};

const seededMeals: Record<MealType, Meal[]> = {
  family: [
    { id: "spaghetti-night", name: "Spaghetti Night", description: "Silky tomato pasta with basil, parmesan, and warm garlic bread." },
    { id: "pizza-night", name: "Pizza Night", description: "Crisp stone-baked slices with rocket, mozzarella, and chili oil." },
    { id: "caesar-salad", name: "Caesar Salad", description: "Romaine, crunchy croutons, parmesan, and lemony chicken on top." },
    { id: "takeaway-night", name: "Takeaway Night", description: "A low-effort night for grabbing your favorite delivery and switching off." },
    { id: "steak-night", name: "Steak Night", description: "Seared steak with crispy potatoes, green beans, and peppercorn sauce." },
    { id: "curry-night", name: "Curry Night", description: "Fragrant coconut curry with steamed rice and lots of fresh herbs." },
    { id: "fajita-night", name: "Fajita Night", description: "Sizzling peppers, onions, and juicy strips ready for the table." },
    { id: "salmon-tray-bake", name: "Salmon Tray Bake", description: "Roasted salmon with lemon, asparagus, and baby potatoes." },
    { id: "burger-night", name: "Burger Night", description: "Juicy burgers, crispy fries, and a good excuse for extra sauce." },
    { id: "lasagna-night", name: "Lasagna", description: "Layered, bubbling, and perfect with a big green salad." },
    { id: "butter-chicken", name: "Butter Chicken", description: "Rich, creamy curry with naan and cucumber raita." },
    { id: "soup-toasties", name: "Soup and Toasties", description: "Something cozy, simple, and gentle before the next week begins." },
  ],
  kids: [
    { id: "cheesy-pasta", name: "Cheesy Pasta", description: "Short pasta with a creamy cheese sauce and peas on the side." },
    { id: "mini-pizzas", name: "Mini Pizzas", description: "Easy little pizzas with simple toppings and lots of melted cheese." },
    { id: "chicken-nuggets", name: "Chicken Nuggets", description: "Crispy nuggets with oven fries, cucumber sticks, and ketchup." },
    { id: "fish-fingers", name: "Fish Fingers", description: "Golden fish fingers with mash and sweetcorn." },
    { id: "quesadilla", name: "Cheese Quesadilla", description: "Toasted tortilla wedges with mild cheese and tomato salsa." },
    { id: "mac-cheese", name: "Mac and Cheese", description: "Creamy macaroni bake with a crunchy golden topping." },
    { id: "sausage-mash", name: "Sausage and Mash", description: "Simple sausages with buttery mash and peas." },
    { id: "pasta-bake", name: "Pasta Bake", description: "Baked pasta with tomato sauce, mozzarella, and garlic bread fingers." },
    { id: "jacket-potato", name: "Jacket Potatoes", description: "Fluffy baked potatoes with beans and grated cheese." },
    { id: "toasties", name: "Ham and Cheese Toasties", description: "Golden toasties with a little salad or veggie sticks on the side." },
    { id: "rice-chicken", name: "Chicken and Rice", description: "Soft rice with little chicken pieces and sweetcorn." },
  ],
};

const seededMembers: FamilyMember[] = [
  { id: "mum", name: "Mum", role: "Wife", color: "#d86d8d" },
  { id: "dad", name: "Dad", role: "Dad", color: "#7b6ef6" },
  { id: "kid", name: "Kid", role: "Child", color: "#74a662" },
];

const seededMealLikes: Record<string, string[]> = {
  "spaghetti-night": ["mum", "dad", "kid"],
  "pizza-night": ["dad", "kid"],
  "steak-night": ["dad"],
  "caesar-salad": ["mum"],
  "mini-pizzas": ["kid"],
};

const weekPlan: DayPlan[] = [
  { day: "Monday", familyMealIds: ["spaghetti-night", "pizza-night", "caesar-salad", "lasagna-night", "burger-night"], kidsMealIds: ["cheesy-pasta", "mini-pizzas", "mac-cheese", "pasta-bake"] },
  { day: "Tuesday", familyMealIds: ["takeaway-night", "burger-night", "pizza-night", "fajita-night", "caesar-salad"], kidsMealIds: ["chicken-nuggets", "mini-pizzas", "fish-fingers", "jacket-potato"] },
  { day: "Wednesday", familyMealIds: ["steak-night", "salmon-tray-bake", "butter-chicken", "curry-night", "lasagna-night"], kidsMealIds: ["sausage-mash", "chicken-nuggets", "rice-chicken", "mac-cheese"] },
  { day: "Thursday", familyMealIds: ["curry-night", "fajita-night", "spaghetti-night", "salmon-tray-bake", "butter-chicken"], kidsMealIds: ["quesadilla", "cheesy-pasta", "chicken-nuggets", "rice-chicken"] },
  { day: "Friday", familyMealIds: ["pizza-night", "burger-night", "takeaway-night", "lasagna-night", "caesar-salad"], kidsMealIds: ["mini-pizzas", "fish-fingers", "chicken-nuggets", "mac-cheese"] },
  { day: "Saturday", familyMealIds: ["lasagna-night", "butter-chicken", "steak-night", "salmon-tray-bake", "pizza-night"], kidsMealIds: ["pasta-bake", "sausage-mash", "mini-pizzas", "jacket-potato"] },
  { day: "Sunday", familyMealIds: ["soup-toasties", "spaghetti-night", "curry-night", "caesar-salad", "takeaway-night"], kidsMealIds: ["toasties", "cheesy-pasta", "fish-fingers", "jacket-potato"] },
];

const storageKey = "dinner-time-next-state-v3";
const maxShuffles = 3;
const householdSlug = process.env.NEXT_PUBLIC_SUPABASE_HOUSEHOLD_SLUG ?? "default";
const memberColors = ["#d86d8d", "#7b6ef6", "#74a662", "#dc8c3d", "#3f8fa3", "#a95acb"];

const shuffleIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
    <path d="M17 3h4v4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M3 7h5l4 5 4 5h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M17 17h4v4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M3 17h5l2-2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    <path d="M14 10l2-2h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  </svg>
);

function todayStamp() {
  return new Date().toDateString();
}

function getTodayName() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

const initialDayState = weekPlan.reduce<Record<string, DayState>>((accumulator, item) => {
  accumulator[item.day] = {
    familyMealId: item.familyMealIds[0],
    kidsMealId: item.kidsMealIds[0],
    useKidsMeal: false,
    familyShufflesUsed: 0,
    kidsShufflesUsed: 0,
  };

  return accumulator;
}, {});

function baseState(): AppState {
  return {
    lastUpdated: todayStamp(),
    customMeals: { family: [], kids: [] },
    days: initialDayState,
    familyMembers: seededMembers,
    mealLikes: seededMealLikes,
  };
}

function loadInitialState(): AppState {
  if (typeof window === "undefined") {
    return baseState();
  }

  const saved = window.localStorage.getItem(storageKey);

  if (!saved) {
    return baseState();
  }

  try {
    const parsed = JSON.parse(saved) as Partial<AppState>;

    return {
      lastUpdated: todayStamp(),
      customMeals: {
        family: parsed.customMeals?.family ?? [],
        kids: parsed.customMeals?.kids ?? [],
      },
      days: parsed.lastUpdated === todayStamp() ? { ...initialDayState, ...parsed.days } : initialDayState,
      familyMembers: parsed.familyMembers?.length ? parsed.familyMembers : seededMembers,
      mealLikes: parsed.mealLikes ? { ...seededMealLikes, ...parsed.mealLikes } : seededMealLikes,
    };
  } catch {
    return baseState();
  }
}

function getMergedMeals(state: AppState, mealType: MealType) {
  const map = new Map<string, Meal>();

  for (const meal of seededMeals[mealType]) {
    map.set(meal.id, meal);
  }

  for (const meal of state.customMeals[mealType]) {
    map.set(meal.id, meal);
  }

  return Array.from(map.values());
}

function mealLookup(state: AppState) {
  return {
    family: Object.fromEntries(getMergedMeals(state, "family").map((meal) => [meal.id, meal])),
    kids: Object.fromEntries(getMergedMeals(state, "kids").map((meal) => [meal.id, meal])),
  } satisfies Record<MealType, Record<string, Meal>>;
}

function getRandomMealId(mealIds: string[], currentMealId: string, mealLikes: Record<string, string[]>) {
  const uniqueIds = [...new Set(mealIds)].filter((mealId) => mealId !== currentMealId);

  if (uniqueIds.length === 0) {
    return currentMealId;
  }

  const weighted = [...uniqueIds].sort((left, right) => {
    const rightScore = mealLikes[right]?.length ?? 0;
    const leftScore = mealLikes[left]?.length ?? 0;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return Math.random() - 0.5;
  });

  return weighted[0];
}

function appSurface(isStrong = false) {
  return cn(
    "rounded-[28px] border border-[rgba(103,73,44,0.12)] shadow-[0_18px_50px_rgba(84,55,31,0.12)] backdrop-blur-xl",
    isStrong ? "bg-[rgba(255,250,244,0.96)]" : "bg-[rgba(255,252,247,0.78)]",
  );
}

function mergeRemoteState(
  current: AppState,
  favorites: FavoriteMealRow[],
  daySettings: DaySettingRow[],
  members: FamilyMemberRow[],
  likes: MealLikeRow[],
): AppState {
  const remoteCustomMeals: Record<MealType, Meal[]> = {
    family: favorites.filter((item) => item.meal_type === "family").map((item) => ({ id: item.meal_key, name: item.name, description: item.description })),
    kids: favorites.filter((item) => item.meal_type === "kids").map((item) => ({ id: item.meal_key, name: item.name, description: item.description })),
  };

  const remoteDays = { ...initialDayState };
  for (const row of daySettings) {
    remoteDays[row.day_name] = {
      familyMealId: row.family_meal_id,
      kidsMealId: row.kids_meal_id,
      useKidsMeal: row.use_kids_meal,
      familyShufflesUsed: row.family_shuffles_used,
      kidsShufflesUsed: row.kids_shuffles_used,
    };
  }

  const remoteLikes = likes.reduce<Record<string, string[]>>((accumulator, row) => {
    accumulator[row.meal_key] = [...(accumulator[row.meal_key] ?? []), row.member_key];
    return accumulator;
  }, {});

  return {
    lastUpdated: todayStamp(),
    customMeals: {
      family: remoteCustomMeals.family.length > 0 ? remoteCustomMeals.family : current.customMeals.family,
      kids: remoteCustomMeals.kids.length > 0 ? remoteCustomMeals.kids : current.customMeals.kids,
    },
    days: daySettings.length > 0 ? remoteDays : current.days,
    familyMembers: members.length > 0 ? members.map((member) => ({ id: member.member_key, name: member.name, role: member.role, color: member.color })) : current.familyMembers,
    mealLikes: likes.length > 0 ? { ...seededMealLikes, ...remoteLikes } : current.mealLikes,
  };
}

function MemberChip({ member }: { member: FamilyMember }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        backgroundColor: `${member.color}1f`,
        color: member.color,
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: member.color }} />
      {member.name}
    </span>
  );
}

export function DinnerPlanner() {
  const [appState, setAppState] = useState<AppState>(loadInitialState);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formType, setFormType] = useState<MealType>("family");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [memberColor, setMemberColor] = useState(memberColors[0]);
  const [syncStatus, setSyncStatus] = useState<"idle" | "loading" | "saving" | "error">("idle");

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const remoteHydratedRef = useRef(false);
  const firstPersistRef = useRef(true);

  const lookup = mealLookup(appState);
  const todayName = getTodayName();
  const todaysState = appState.days[todayName];
  const todaysPlan = weekPlan.find((item) => item.day === todayName);
  const todaysMeal = todaysState ? lookup.family[todaysState.familyMealId] : null;

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(appState));
  }, [appState]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

      if (!isActive) {
        return;
      }

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
    if (!supabase || !remoteHydratedRef.current) {
      return;
    }

    const client = supabase;

    if (firstPersistRef.current) {
      firstPersistRef.current = false;
      return;
    }

    let cancelled = false;

    async function persistRemoteState() {
      setSyncStatus("saving");

      const favoriteRows: FavoriteMealRow[] = (["family", "kids"] as MealType[]).flatMap((mealType) =>
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
        insertLikesResult = await client
          .from("meal_member_preferences")
          .insert(likeRows);
      }

      if (cancelled) {
        return;
      }

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

  const todaySuggestions =
    todaysPlan && todaysState
      ? [...new Set([...todaysPlan.familyMealIds, ...appState.customMeals.family.map((meal) => meal.id)])]
          .filter((mealId) => mealId !== todaysState.familyMealId)
          .sort((left, right) => (appState.mealLikes[right]?.length ?? 0) - (appState.mealLikes[left]?.length ?? 0))
          .slice(0, 3)
          .map((mealId) => lookup.family[mealId]?.name.replace(" Night", ""))
          .filter(Boolean)
      : [];

  function getMealMembers(mealId: string) {
    const memberIds = appState.mealLikes[mealId] ?? [];
    return appState.familyMembers.filter((member) => memberIds.includes(member.id));
  }

  function updateDay(day: string, updater: (current: DayState) => DayState) {
    startTransition(() => {
      setAppState((current) => ({
        ...current,
        lastUpdated: todayStamp(),
        days: {
          ...current.days,
          [day]: updater(current.days[day]),
        },
      }));
    });
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

    if (!trimmedName || !trimmedDescription) {
      return;
    }

    const baseId = (editingMealId ?? slugify(trimmedName)) || `meal-${Date.now()}`;
    let nextId = baseId;
    let counter = 2;

    while (lookup[formType][nextId] && nextId !== editingMealId) {
      nextId = `${baseId}-${counter}`;
      counter += 1;
    }

    const nextMeal: Meal = {
      id: nextId,
      name: trimmedName,
      description: trimmedDescription,
    };

    startTransition(() => {
      setAppState((current) => {
        const existing = current.customMeals[formType].filter((meal) => meal.id !== nextId);

        return {
          ...current,
          customMeals: {
            ...current.customMeals,
            [formType]: [nextMeal, ...existing],
          },
          mealLikes: {
            ...current.mealLikes,
            [nextId]: selectedMemberIds,
          },
        };
      });
    });

    resetMealForm();
  }

  function startEditingMeal(mealType: MealType, meal: Meal) {
    setDrawerOpen(true);
    setEditingMealId(meal.id);
    setFormType(mealType);
    setFormName(meal.name);
    setFormDescription(meal.description);
    setSelectedMemberIds(appState.mealLikes[meal.id] ?? []);
  }

  function addFamilyMember() {
    const trimmedName = memberName.trim();
    const trimmedRole = memberRole.trim();

    if (!trimmedName) {
      return;
    }

    const baseId = slugify(trimmedName) || `member-${Date.now()}`;
    let nextId = baseId;
    let counter = 2;

    while (appState.familyMembers.some((member) => member.id === nextId)) {
      nextId = `${baseId}-${counter}`;
      counter += 1;
    }

    startTransition(() => {
      setAppState((current) => ({
        ...current,
        familyMembers: [
          ...current.familyMembers,
          {
            id: nextId,
            name: trimmedName,
            role: trimmedRole || "Family",
            color: memberColor,
          },
        ],
      }));
    });

    setMemberName("");
    setMemberRole("");
    setMemberColor(memberColors[(memberColors.indexOf(memberColor) + 1) % memberColors.length]);
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
                {todaySuggestions.length > 0 ? `Maybe order ${todaySuggestions.join(", ")}.` : "Pick something easy tonight."}
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
              {syncStatus === "loading" && "Loading Supabase data"}
              {syncStatus === "saving" && "Saving to Supabase"}
              {syncStatus === "error" && "Supabase sync issue"}
              {syncStatus === "idle" && "Family favorites live"}
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
            className="inline-flex h-11 items-center justify-center rounded-full bg-white/80 px-5 text-sm font-semibold text-foreground shadow-[0_10px_24px_rgba(84,55,31,0.08)] transition hover:-translate-y-0.5"
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
              <article key={dayPlan.day} className={cn(appSurface(), "flex flex-col gap-4 rounded-[24px] p-5", dayPlan.day === todayName && "outline-2 outline-offset-0 outline-[rgba(200,92,61,0.28)]")}>
                <p className="font-display text-3xl leading-none">{dayPlan.day}</p>

                <div className="grid gap-3">
                  <section className="rounded-[22px] bg-surface-strong p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-accent-deep">Family dinner</p>
                        <h3 className="font-display text-4xl leading-none tracking-tight">{familyMeal?.name ?? "Choose dinner"}</h3>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="inline-flex min-w-18 items-center justify-center rounded-full bg-[rgba(200,92,61,0.12)] px-3 py-2 text-sm font-bold text-accent-deep">
                          {state.familyShufflesUsed}/{maxShuffles}
                        </span>
                        <button
                          type="button"
                          disabled={familyDisabled}
                          onClick={() =>
                            updateDay(dayPlan.day, (current) => ({
                              ...current,
                              familyMealId: getRandomMealId(
                                [...dayPlan.familyMealIds, ...appState.customMeals.family.map((meal) => meal.id)],
                                current.familyMealId,
                                appState.mealLikes,
                              ),
                              familyShufflesUsed: current.familyShufflesUsed + 1,
                            }))
                          }
                          className={cn(
                            "inline-flex h-11 w-11 items-center justify-center rounded-full shadow-[0_10px_18px_rgba(143,52,27,0.12)] transition",
                            familyDisabled
                              ? "cursor-not-allowed bg-[rgba(119,98,76,0.14)] text-[rgba(119,98,76,0.62)]"
                              : "bg-[rgba(200,92,61,0.12)] text-accent-deep hover:-translate-y-0.5",
                          )}
                          aria-label={familyDisabled ? "No family shuffles left" : "Shuffle family meal"}
                        >
                          {shuffleIcon}
                        </button>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted">{familyMeal?.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {familyMeal ? getMealMembers(familyMeal.id).map((member) => <MemberChip key={member.id} member={member} />) : null}
                    </div>
                  </section>

                  <section className={cn("rounded-[22px] bg-surface-strong p-4 transition", !state.useKidsMeal && "opacity-80")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-accent-deep">Kids dinner</p>
                        <h3 className="font-display text-[1.8rem] leading-none tracking-tight">
                          {state.useKidsMeal ? kidsMeal?.name ?? "Choose kids meal" : "Same as family dinner"}
                        </h3>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <label className="relative inline-flex h-7 w-12 cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={state.useKidsMeal}
                            onChange={(event) =>
                              updateDay(dayPlan.day, (current) => ({
                                ...current,
                                useKidsMeal: event.target.checked,
                              }))
                            }
                            className="peer sr-only"
                          />
                          <span className="h-7 w-12 rounded-full bg-[rgba(119,98,76,0.2)] transition peer-checked:bg-[#7e9f68]" />
                          <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-[#fffaf4] shadow-[0_4px_10px_rgba(47,36,25,0.16)] transition peer-checked:translate-x-5" />
                        </label>

                        {state.useKidsMeal ? (
                          <>
                            <span className="inline-flex min-w-18 items-center justify-center rounded-full bg-[rgba(130,166,118,0.14)] px-3 py-2 text-sm font-bold text-[#49603e]">
                              {state.kidsShufflesUsed}/{maxShuffles}
                            </span>
                            <button
                              type="button"
                              disabled={kidsDisabled}
                              onClick={() =>
                                updateDay(dayPlan.day, (current) => ({
                                  ...current,
                                  kidsMealId: getRandomMealId(
                                    [...dayPlan.kidsMealIds, ...appState.customMeals.kids.map((meal) => meal.id)],
                                    current.kidsMealId,
                                    appState.mealLikes,
                                  ),
                                  kidsShufflesUsed: current.kidsShufflesUsed + 1,
                                }))
                              }
                              className={cn(
                                "inline-flex h-11 w-11 items-center justify-center rounded-full transition",
                                kidsDisabled
                                  ? "cursor-not-allowed bg-[rgba(119,98,76,0.14)] text-[rgba(119,98,76,0.62)]"
                                  : "bg-[rgba(126,159,104,0.14)] text-[#49603e] shadow-[0_10px_18px_rgba(73,96,62,0.14)] hover:-translate-y-0.5",
                              )}
                              aria-label={kidsDisabled ? "No kids shuffles left" : "Shuffle kids meal"}
                            >
                              {shuffleIcon}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted">
                      {state.useKidsMeal ? kidsMeal?.description : "Kids will have what the parents are having tonight."}
                    </p>
                    {state.useKidsMeal && kidsMeal ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {getMealMembers(kidsMeal.id).map((member) => (
                          <MemberChip key={member.id} member={member} />
                        ))}
                      </div>
                    ) : null}
                  </section>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      <div hidden={!drawerOpen} className="fixed inset-0 z-40 bg-[rgba(47,36,25,0.28)] backdrop-blur-[4px]" onClick={() => setDrawerOpen(false)} />

      <aside
        aria-hidden={!drawerOpen}
        className={cn(
          "fixed right-0 top-0 z-50 h-screen w-full max-w-[460px] overflow-y-auto border-l border-[rgba(103,73,44,0.12)] bg-[rgba(247,238,229,0.96)] px-5 py-6 shadow-[-20px_0_50px_rgba(84,55,31,0.16)] backdrop-blur-xl transition-transform",
          drawerOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-accent-deep">Meal library</p>
            <h2 className="font-display text-3xl leading-none">Edit meals and family favorites</h2>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-xl shadow-[0_10px_24px_rgba(84,55,31,0.08)] transition hover:-translate-y-0.5"
            aria-label="Close meal library"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid gap-5">
          <section className={cn(appSurface(true), "rounded-[24px] p-5")}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <p className="font-display text-2xl">{editingMealId ? "Edit meal" : "Add a meal"}</p>
              {editingMealId ? (
                <button type="button" onClick={resetMealForm} className="text-sm font-semibold text-muted">
                  Cancel edit
                </button>
              ) : null}
            </div>
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm font-semibold text-accent-deep">
                Meal type
                <select
                  value={formType}
                  onChange={(event) => setFormType(event.target.value as MealType)}
                  className="h-12 rounded-2xl border border-[rgba(103,73,44,0.14)] bg-white px-4 text-foreground outline-none"
                >
                  <option value="family">Family meal</option>
                  <option value="kids">Kids meal</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-accent-deep">
                Meal name
                <input
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="Pizza wraps"
                  className="h-12 rounded-2xl border border-[rgba(103,73,44,0.14)] bg-white px-4 text-foreground outline-none"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-accent-deep">
                Short description
                <textarea
                  value={formDescription}
                  onChange={(event) => setFormDescription(event.target.value)}
                  placeholder="Quick, easy, and always gets eaten."
                  className="min-h-24 rounded-2xl border border-[rgba(103,73,44,0.14)] bg-white px-4 py-3 text-foreground outline-none"
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
                            current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id],
                          )
                        }
                        className={cn(
                          "rounded-full border px-3 py-2 text-sm font-semibold transition",
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
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-semibold text-[#fff8f3] shadow-[0_14px_24px_rgba(143,52,27,0.2)] transition hover:-translate-y-0.5"
              >
                {editingMealId ? "Save changes" : "Add to favorites"}
              </button>
            </div>
          </section>

          <section className={cn(appSurface(), "rounded-[24px] p-5")}>
            <p className="mb-4 font-display text-2xl">Family members</p>
            <div className="grid gap-3">
              <label className="grid gap-2 text-sm font-semibold text-accent-deep">
                Name
                <input
                  value={memberName}
                  onChange={(event) => setMemberName(event.target.value)}
                  placeholder="Ella"
                  className="h-12 rounded-2xl border border-[rgba(103,73,44,0.14)] bg-white px-4 text-foreground outline-none"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-accent-deep">
                Role
                <input
                  value={memberRole}
                  onChange={(event) => setMemberRole(event.target.value)}
                  placeholder="Daughter"
                  className="h-12 rounded-2xl border border-[rgba(103,73,44,0.14)] bg-white px-4 text-foreground outline-none"
                />
              </label>
              <div className="grid gap-2">
                <p className="text-sm font-semibold text-accent-deep">Pick a color</p>
                <div className="flex flex-wrap gap-2">
                  {memberColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setMemberColor(color)}
                      className={cn("h-9 w-9 rounded-full border-2", memberColor === color ? "border-foreground" : "border-transparent")}
                      style={{ backgroundColor: color }}
                      aria-label={`Select ${color}`}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={addFamilyMember}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#2f2419] px-5 text-sm font-semibold text-[#fff8f3] transition hover:-translate-y-0.5"
              >
                Add family member
              </button>
            </div>
            <div className="mt-5 grid gap-3">
              {appState.familyMembers.map((member) => {
                const favoriteMealNames = Object.entries(appState.mealLikes)
                  .filter(([, memberIds]) => memberIds.includes(member.id))
                  .map(([mealId]) => lookup.family[mealId]?.name ?? lookup.kids[mealId]?.name)
                  .filter(Boolean)
                  .slice(0, 4);

                return (
                  <article key={member.id} className="rounded-[18px] border border-[rgba(103,73,44,0.08)] bg-white/80 p-4">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: member.color }} />
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted">{member.role}</p>
                      </div>
                    </div>
                    {favoriteMealNames.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {favoriteMealNames.map((mealName) => (
                          <span key={`${member.id}-${mealName}`} className="rounded-full bg-[rgba(103,73,44,0.08)] px-3 py-1 text-xs font-medium text-muted">
                            {mealName}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          {(["family", "kids"] as MealType[]).map((type) => (
            <section key={type} className={cn(appSurface(), "rounded-[24px] p-5")}>
              <p className="mb-4 font-display text-2xl">{type === "family" ? "Family meals" : "Kids meals"}</p>
              <div className="grid gap-3">
                {getMergedMeals(appState, type).map((meal) => (
                  <article key={meal.id} className="rounded-[18px] border border-[rgba(103,73,44,0.08)] bg-white/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-display text-xl leading-none">{meal.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted">{meal.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => startEditingMeal(type, meal)}
                        className="rounded-full bg-[rgba(103,73,44,0.08)] px-3 py-2 text-xs font-semibold text-foreground"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {getMealMembers(meal.id).map((member) => (
                        <MemberChip key={`${meal.id}-${member.id}`} member={member} />
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-3 rounded-full bg-[#2f2419] px-5 py-3 text-sm font-semibold text-[#fff8f3] shadow-[0_18px_32px_rgba(47,36,25,0.22)] transition hover:-translate-y-0.5"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15">≡</span>
          Meals
        </button>
      </nav>
    </div>
  );
}
