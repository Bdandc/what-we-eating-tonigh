import { cn } from "@/lib/utils";

export type MealType = "family" | "kids";

export type Meal = {
  id: string;
  name: string;
  description: string;
};

export type FamilyMember = {
  id: string;
  name: string;
  role: string;
  color: string;
};

export type DayPlan = {
  day: string;
  familyMealIds: string[];
  kidsMealIds: string[];
};

export type DayState = {
  familyMealId: string;
  kidsMealId: string;
  useKidsMeal: boolean;
  familyShufflesUsed: number;
  kidsShufflesUsed: number;
};

export type AppState = {
  lastUpdated: string;
  customMeals: Record<MealType, Meal[]>;
  days: Record<string, DayState>;
  familyMembers: FamilyMember[];
  mealLikes: Record<string, string[]>;
};

export type FavoriteMealRow = {
  household_slug: string;
  meal_type: MealType;
  meal_key: string;
  name: string;
  description: string;
  created_at?: string;
};

export type DaySettingRow = {
  household_slug: string;
  day_name: string;
  family_meal_id: string;
  kids_meal_id: string;
  use_kids_meal: boolean;
  family_shuffles_used: number;
  kids_shuffles_used: number;
  updated_at?: string;
};

export type FamilyMemberRow = {
  household_slug: string;
  member_key: string;
  name: string;
  role: string;
  color: string;
  created_at?: string;
};

export type MealLikeRow = {
  household_slug: string;
  meal_key: string;
  member_key: string;
  created_at?: string;
};

export const seededMeals: Record<MealType, Meal[]> = {
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

export const seededMembers: FamilyMember[] = [
  { id: "mum", name: "Mum", role: "Wife", color: "#d86d8d" },
  { id: "dad", name: "Dad", role: "Dad", color: "#7b6ef6" },
  { id: "kid", name: "Kid", role: "Child", color: "#74a662" },
];

export const seededMealLikes: Record<string, string[]> = {
  "spaghetti-night": ["mum", "dad", "kid"],
  "pizza-night": ["dad", "kid"],
  "steak-night": ["dad"],
  "caesar-salad": ["mum"],
  "mini-pizzas": ["kid"],
};

export const weekPlan: DayPlan[] = [
  { day: "Monday", familyMealIds: ["spaghetti-night", "pizza-night", "caesar-salad", "lasagna-night", "burger-night"], kidsMealIds: ["cheesy-pasta", "mini-pizzas", "mac-cheese", "pasta-bake"] },
  { day: "Tuesday", familyMealIds: ["takeaway-night", "burger-night", "pizza-night", "fajita-night", "caesar-salad"], kidsMealIds: ["chicken-nuggets", "mini-pizzas", "fish-fingers", "jacket-potato"] },
  { day: "Wednesday", familyMealIds: ["steak-night", "salmon-tray-bake", "butter-chicken", "curry-night", "lasagna-night"], kidsMealIds: ["sausage-mash", "chicken-nuggets", "rice-chicken", "mac-cheese"] },
  { day: "Thursday", familyMealIds: ["curry-night", "fajita-night", "spaghetti-night", "salmon-tray-bake", "butter-chicken"], kidsMealIds: ["quesadilla", "cheesy-pasta", "chicken-nuggets", "rice-chicken"] },
  { day: "Friday", familyMealIds: ["pizza-night", "burger-night", "takeaway-night", "lasagna-night", "caesar-salad"], kidsMealIds: ["mini-pizzas", "fish-fingers", "chicken-nuggets", "mac-cheese"] },
  { day: "Saturday", familyMealIds: ["lasagna-night", "butter-chicken", "steak-night", "salmon-tray-bake", "pizza-night"], kidsMealIds: ["pasta-bake", "sausage-mash", "mini-pizzas", "jacket-potato"] },
  { day: "Sunday", familyMealIds: ["soup-toasties", "spaghetti-night", "curry-night", "caesar-salad", "takeaway-night"], kidsMealIds: ["toasties", "cheesy-pasta", "fish-fingers", "jacket-potato"] },
];

export const storageKey = "dinner-time-next-state-v3";
export const maxShuffles = 3;
export const memberColors = ["#d86d8d", "#7b6ef6", "#74a662", "#dc8c3d", "#3f8fa3", "#a95acb"];

export function todayStamp() {
  return new Date().toDateString();
}

export function getTodayName() {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

export const initialDayState = weekPlan.reduce<Record<string, DayState>>((accumulator, item) => {
  accumulator[item.day] = {
    familyMealId: item.familyMealIds[0],
    kidsMealId: item.kidsMealIds[0],
    useKidsMeal: false,
    familyShufflesUsed: 0,
    kidsShufflesUsed: 0,
  };
  return accumulator;
}, {});

export function baseState(): AppState {
  return {
    lastUpdated: todayStamp(),
    customMeals: { family: [], kids: [] },
    days: initialDayState,
    familyMembers: seededMembers,
    mealLikes: seededMealLikes,
  };
}

export function loadInitialState(): AppState {
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

export function getMergedMeals(state: AppState, mealType: MealType) {
  const map = new Map<string, Meal>();

  for (const meal of seededMeals[mealType]) {
    map.set(meal.id, meal);
  }

  for (const meal of state.customMeals[mealType]) {
    map.set(meal.id, meal);
  }

  return Array.from(map.values());
}

export function mealLookup(state: AppState) {
  return {
    family: Object.fromEntries(getMergedMeals(state, "family").map((meal) => [meal.id, meal])),
    kids: Object.fromEntries(getMergedMeals(state, "kids").map((meal) => [meal.id, meal])),
  } satisfies Record<MealType, Record<string, Meal>>;
}

export function getRandomMealId(mealIds: string[], currentMealId: string, mealLikes: Record<string, string[]>) {
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

export function mergeRemoteState(
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

export function appSurface(isStrong = false) {
  return cn(
    "rounded-[28px] border border-[rgba(103,73,44,0.12)] shadow-[0_18px_50px_rgba(84,55,31,0.12)] backdrop-blur-xl",
    isStrong ? "bg-[rgba(255,250,244,0.96)]" : "bg-[rgba(255,252,247,0.78)]",
  );
}
