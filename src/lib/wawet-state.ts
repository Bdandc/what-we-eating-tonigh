import {
  type Category,
  type MealKind,
  type Weekday,
  CATEGORIES,
  LIKELY_STOCKED,
  starterMeals,
  WEEKDAYS,
  familyMeals,
  kidsMeals,
  mealById,
  meals,
  seededIngredients,
} from "@/lib/wawet-data";

export type TodayState = {
  date: string;
  suggestionId: string;
  kidsSuggestionId: string;
  shufflesUsed: number;
  view: MealKind;
  takeawaySkipped: boolean;
};

export type CustomIngredient = {
  id: string;
  name: string;
  category: Category;
};

export type CustomMeal = {
  id: string;
  name: string;
  description: string;
  kind: MealKind;
  ingredients: string[];
};

export type Settings = {
  takeawayDay: Weekday | null;
  kidsEnabled: boolean;
};

/** Meal ids dealt on previous days, most recent first, per view. */
export type RecentSuggestions = {
  family: string[];
  kids: string[];
};

export type WawetState = {
  version: 1;
  today: TodayState;
  pantry: Record<string, boolean>;
  customIngredients: CustomIngredient[];
  customMeals: CustomMeal[];
  /** One-time starter seeding marker: once true, deleted starters STAY deleted. */
  startersSeeded: boolean;
  recent: RecentSuggestions;
  /** Built-in meal ids the user has hidden: never suggested, never dealt. */
  hiddenSeededMeals: string[];
  settings: Settings;
};

export const STORAGE_KEY = "wawet-state-v1";
export const LEGACY_STORAGE_KEY = "dinner-time-next-state-v3";
export const MAX_SHUFFLES = 3;
export const RECENT_SUGGESTION_DAYS = 3;
export const MAX_CUSTOM_INGREDIENTS = 200;
export const MAX_INGREDIENT_NAME_LENGTH = 60;
export const MAX_CUSTOM_MEALS = 100;
export const MAX_MEAL_DESCRIPTION_LENGTH = 200;

const CUSTOM_ID_RE =
  /^c-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CUSTOM_MEAL_ID_RE =
  /^m-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function stripControl(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export function todayLocalDate(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function weekdayName(now: Date = new Date()): Weekday {
  return WEEKDAYS[(now.getDay() + 6) % 7];
}

// ---------------------------------------------------------------------------
// Deterministic pick
// ---------------------------------------------------------------------------

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function pick(poolIds: string[], seed: string): string {
  const sorted = [...new Set(poolIds)].sort();
  if (sorted.length === 0) {
    throw new Error("pick() called with an empty pool");
  }
  return sorted[fnv1a(seed) % sorted.length];
}

// ---------------------------------------------------------------------------
// Eligibility (pantry filter)
// ---------------------------------------------------------------------------

function poolFor(
  kind: MealKind,
  customMeals: CustomMeal[] = [],
  hidden: string[] = [],
) {
  const seeded = kind === "family" ? familyMeals : kidsMeals;
  const hiddenSet = new Set(hidden);
  return [
    ...seeded.filter((meal) => !hiddenSet.has(meal.id)),
    ...customMeals.filter((meal) => meal.kind === kind),
  ];
}

export function eligibleIds(
  kind: MealKind,
  pantry: Record<string, boolean>,
  customMeals: CustomMeal[] = [],
  hidden: string[] = [],
): string[] {
  return poolFor(kind, customMeals, hidden)
    .filter((meal) => meal.ingredients.every((ing) => pantry[ing] === true))
    .map((meal) => meal.id);
}

export function fullIds(
  kind: MealKind,
  customMeals: CustomMeal[] = [],
  hidden: string[] = [],
): string[] {
  return poolFor(kind, customMeals, hidden).map((meal) => meal.id);
}

export function isFallback(
  kind: MealKind,
  pantry: Record<string, boolean>,
  customMeals: CustomMeal[] = [],
  hidden: string[] = [],
): boolean {
  return eligibleIds(kind, pantry, customMeals, hidden).length === 0;
}

/** Eligible pool, or the full pool when the eligible pool is empty (fallback mode). */
function activeIds(
  kind: MealKind,
  pantry: Record<string, boolean>,
  customMeals: CustomMeal[] = [],
  hidden: string[] = [],
): string[] {
  const eligible = eligibleIds(kind, pantry, customMeals, hidden);
  return eligible.length > 0 ? eligible : fullIds(kind, customMeals, hidden);
}

function dailyPick(
  kind: MealKind,
  pantry: Record<string, boolean>,
  customMeals: CustomMeal[],
  date: string,
  salt: number,
): string {
  return pick(activeIds(kind, pantry, customMeals), `${date}:${kind}:${salt}`);
}

/** Prepend today's dealt id to the recent list, most recent first, capped. */
function pushRecent(list: string[], id: string): string[] {
  return [id, ...list.filter((x) => x !== id)].slice(0, RECENT_SUGGESTION_DAYS);
}

/** mealById lookup that cannot be fooled by Object.prototype keys: untrusted
 * ids like "toString" must read as unknown, not as a built-in meal. */
function seededMealFor(id: string) {
  return Object.hasOwn(mealById, id) ? mealById[id] : undefined;
}

/**
 * Drop hidden entries for any view whose visible pool would otherwise be
 * empty. The deck must always hold at least one card per view or pick()
 * dies, and the pool can shrink through more doors than the hide toggle:
 * deleting or re-kinding the last custom meal of a view, and persisted
 * states, all funnel through this same rule.
 */
function dropHiddenForEmptyViews(hidden: string[], customMeals: CustomMeal[]): string[] {
  let out = hidden;
  for (const kind of ["family", "kids"] as const) {
    if (fullIds(kind, customMeals, out).length === 0) {
      out = out.filter((id) => seededMealFor(id)?.kind !== kind);
    }
  }
  return out;
}

/**
 * New-day pick that avoids recently dealt meals. Pantry-matched meals come
 * first, but a repeat of yesterday is the LAST resort: the pick extends past
 * the pantry (exactly like the shuffle does) before it ever re-deals
 * yesterday's card. Only a single-meal library can force a repeat.
 */
function varietyPick(
  kind: MealKind,
  pantry: Record<string, boolean>,
  customMeals: CustomMeal[],
  recent: string[],
  date: string,
  hidden: string[] = [],
): string {
  const eligible = eligibleIds(kind, pantry, customMeals, hidden);
  const full = fullIds(kind, customMeals, hidden);
  const recentSet = new Set(recent);
  const yesterday = recent[0];
  const pool =
    [
      eligible.filter((id) => !recentSet.has(id)),
      eligible.filter((id) => id !== yesterday),
      full.filter((id) => !recentSet.has(id)),
      full.filter((id) => id !== yesterday),
    ].find((p) => p.length > 0) ?? (eligible.length > 0 ? eligible : full);
  return pick(pool, `${date}:${kind}:0`);
}

/** Resolve a meal id against the seeded library and the user's own meals. */
export function resolveMeal(state: WawetState, id: string) {
  return mealById[id] ?? state.customMeals.find((meal) => meal.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Fresh state
// ---------------------------------------------------------------------------

function defaultPantry(customIngredients: CustomIngredient[] = []): Record<string, boolean> {
  // First run: pre-tick the items most kitchens actually have (cupboard,
  // freezer, and fridge basics) so the pantry is useful before it is touched.
  const likely = new Set(LIKELY_STOCKED);
  const pantry: Record<string, boolean> = Object.create(null);
  for (const ing of seededIngredients) pantry[ing.id] = likely.has(ing.id);
  for (const ing of customIngredients) pantry[ing.id] = false;
  return pantry;
}

export function freshState(now: Date = new Date()): WawetState {
  const date = todayLocalDate(now);
  const pantry = defaultPantry();
  return {
    version: 1,
    today: {
      date,
      suggestionId: dailyPick("family", pantry, [], date, 0),
      kidsSuggestionId: dailyPick("kids", pantry, [], date, 0),
      shufflesUsed: 0,
      view: "family",
      takeawaySkipped: false,
    },
    pantry,
    customIngredients: [],
    customMeals: starterMeals.map((m) => ({ ...m, ingredients: [...m.ingredients] })),
    startersSeeded: true,
    recent: { family: [], kids: [] },
    hiddenSeededMeals: [],
    settings: { takeawayDay: "Tuesday", kidsEnabled: true },
  };
}

// ---------------------------------------------------------------------------
// parseState — full validation of untrusted persisted state
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseState(raw: string | null, now: Date = new Date()): WawetState {
  const fallback = () => freshState(now);
  if (!raw) return fallback();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback();
  }
  if (!isRecord(parsed) || parsed.version !== 1) return fallback();

  const rawToday = isRecord(parsed.today) ? parsed.today : null;
  const rawSettings = isRecord(parsed.settings) ? parsed.settings : null;
  if (!rawToday || !rawSettings) return fallback();

  // Settings
  const takeawayDay =
    rawSettings.takeawayDay === null || WEEKDAYS.includes(rawSettings.takeawayDay as Weekday)
      ? (rawSettings.takeawayDay as Weekday | null)
      : "Tuesday";
  const kidsEnabled = typeof rawSettings.kidsEnabled === "boolean" ? rawSettings.kidsEnabled : true;

  // Custom ingredients: validate each entry, drop malformed/duplicate ids and
  // duplicate names; cap the count.
  const validCategories = new Set(CATEGORIES.map((c) => c.id));
  const seededNames = new Set(seededIngredients.map((i) => i.name.toLowerCase()));
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const customIngredients: CustomIngredient[] = [];
  if (Array.isArray(parsed.customIngredients)) {
    for (const entry of parsed.customIngredients) {
      if (!isRecord(entry)) continue;
      const { id, name, category } = entry;
      if (typeof id !== "string" || !CUSTOM_ID_RE.test(id) || seenIds.has(id)) continue;
      if (typeof name !== "string") continue;
      const trimmed = name.trim();
      if (trimmed.length === 0 || trimmed.length > MAX_INGREDIENT_NAME_LENGTH) continue;
      const lower = trimmed.toLowerCase();
      if (seededNames.has(lower) || seenNames.has(lower)) continue;
      if (typeof category !== "string" || !validCategories.has(category as Category)) continue;
      if (customIngredients.length >= MAX_CUSTOM_INGREDIENTS) break;
      seenIds.add(id);
      seenNames.add(lower);
      customIngredients.push({ id, name: trimmed, category: category as Category });
    }
  }

  // Pantry: allowlist-first rebuild — iterate known ids, never parsed keys.
  const rawPantry = isRecord(parsed.pantry) ? parsed.pantry : {};
  // Migration: a state written before the catalogue rebuild carries ticks for
  // since-removed ids and none for the new staples, stranding users in
  // strange, sparse pools. Detect it by the removed ids and tick the staples
  // in, exactly like a first run would.
  const LEGACY_REMOVED = ["cheese-sticks", "sweet-potato-fries", "breaded-mushrooms", "pizza-pockets"];
  const isLegacyState = LEGACY_REMOVED.some((id) =>
    Object.prototype.hasOwnProperty.call(rawPantry, id),
  );
  const staples = new Set(isLegacyState ? LIKELY_STOCKED : []);
  const pantry: Record<string, boolean> = Object.create(null);
  for (const ing of seededIngredients) {
    pantry[ing.id] = rawPantry[ing.id] === true || staples.has(ing.id);
  }
  for (const ing of customIngredients) {
    pantry[ing.id] = rawPantry[ing.id] === true;
  }

  // Custom meals: same discipline as custom ingredients — opaque m-<UUID> ids,
  // global case-insensitive name uniqueness vs the seeded library and each
  // other, valid kind, ingredients pruned to known ids, capped count.
  const knownIngredientIds = new Set([
    ...seededIngredients.map((i) => i.id),
    ...customIngredients.map((i) => i.id),
  ]);
  const seededMealNames = new Set(meals.map((m) => m.name.toLowerCase()));
  const seenMealIds = new Set<string>();
  const seenMealNames = new Set<string>();
  const customMeals: CustomMeal[] = [];
  if (Array.isArray(parsed.customMeals)) {
    for (const entry of parsed.customMeals) {
      if (!isRecord(entry)) continue;
      const { id, name, description, kind, ingredients } = entry;
      if (typeof id !== "string" || !CUSTOM_MEAL_ID_RE.test(id) || seenMealIds.has(id)) continue;
      if (typeof name !== "string") continue;
      const trimmedName = name.trim();
      if (trimmedName.length === 0 || trimmedName.length > MAX_INGREDIENT_NAME_LENGTH) continue;
      const lowerName = trimmedName.toLowerCase();
      if (seededMealNames.has(lowerName) || seenMealNames.has(lowerName)) continue;
      if (kind !== "family" && kind !== "kids") continue;
      const desc =
        typeof description === "string"
          ? description.trim().slice(0, MAX_MEAL_DESCRIPTION_LENGTH)
          : "";
      const mealIngredients = Array.isArray(ingredients)
        ? [...new Set(ingredients.filter((i): i is string => typeof i === "string" && knownIngredientIds.has(i)))]
        : [];
      if (customMeals.length >= MAX_CUSTOM_MEALS) break;
      seenMealIds.add(id);
      seenMealNames.add(lowerName);
      customMeals.push({ id, name: trimmedName, description: desc, kind, ingredients: mealIngredients });
    }
  }

  // One-time starter seeding for EVERY install that has not had it yet -
  // including states that already hold the user's own meals. The persisted
  // marker makes later deletions stick; a name or id clash skips just that
  // starter (the user's meal wins).
  let startersSeeded = parsed.startersSeeded === true;
  if (!startersSeeded) {
    const takenIds = new Set(customMeals.map((m) => m.id));
    const takenNames = new Set(customMeals.map((m) => m.name.toLowerCase()));
    for (const starter of starterMeals) {
      if (customMeals.length >= MAX_CUSTOM_MEALS) break;
      if (takenIds.has(starter.id) || takenNames.has(starter.name.toLowerCase())) continue;
      customMeals.push({ ...starter, ingredients: [...starter.ingredients] });
    }
    startersSeeded = true;
  }

  // Hidden built-ins: known seeded ids only, deduped. A view whose every
  // visible meal would vanish gets its hidden entries dropped instead: the
  // deck must always hold at least one card per view or pick() dies.
  const rawHidden: string[] = [];
  if (Array.isArray(parsed.hiddenSeededMeals)) {
    for (const id of parsed.hiddenSeededMeals) {
      if (typeof id !== "string" || !seededMealFor(id) || rawHidden.includes(id)) continue;
      rawHidden.push(id);
    }
  }
  const hiddenSeededMeals = dropHiddenForEmptyViews(rawHidden, customMeals);

  // Recent suggestions: known meal ids only, deduped, capped. A missing or
  // malformed history costs nothing worse than a possible repeat tomorrow.
  // Hidden ids stay valid here: they are exclusions, not candidates.
  const rawRecent = isRecord(parsed.recent) ? parsed.recent : {};
  const readRecent = (kind: MealKind, value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    const known = new Set(fullIds(kind, customMeals));
    const out: string[] = [];
    for (const id of value) {
      if (typeof id !== "string" || !known.has(id) || out.includes(id)) continue;
      out.push(id);
      if (out.length >= RECENT_SUGGESTION_DAYS) break;
    }
    return out;
  };
  const recent: RecentSuggestions = {
    family: readRecent("family", rawRecent.family),
    kids: readRecent("kids", rawRecent.kids),
  };

  // Today
  const date = typeof rawToday.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawToday.date)
    ? rawToday.date
    : todayLocalDate(now);
  const shufflesUsed =
    typeof rawToday.shufflesUsed === "number" && Number.isFinite(rawToday.shufflesUsed)
      ? Math.min(MAX_SHUFFLES, Math.max(0, Math.floor(rawToday.shufflesUsed)))
      : 0;
  const view: MealKind =
    rawToday.view === "kids" && kidsEnabled ? "kids" : "family";
  const takeawaySkipped = rawToday.takeawaySkipped === true;

  // Suggestion ids: repair DANGLING ids only (meal no longer exists). An
  // id that is merely ineligible under the current pantry is kept: the pantry
  // is a draft until the user commits it, so a reload or navigation must never
  // re-pick the dish on its own. Eligibility re-matching happens exclusively
  // in commitPantry(), at rollover, and on shuffle.
  const repair = (kind: MealKind, id: unknown): string => {
    const full = fullIds(kind, customMeals, hiddenSeededMeals);
    if (typeof id === "string" && full.includes(id)) return id;
    return pick(
      activeIds(kind, pantry, customMeals, hiddenSeededMeals),
      `${date}:${kind}:${shufflesUsed}`,
    );
  };

  const state: WawetState = {
    version: 1,
    today: {
      date,
      suggestionId: repair("family", rawToday.suggestionId),
      kidsSuggestionId: repair("kids", rawToday.kidsSuggestionId),
      shufflesUsed,
      view,
      takeawaySkipped,
    },
    pantry,
    customIngredients,
    customMeals,
    startersSeeded,
    recent,
    hiddenSeededMeals,
    settings: { takeawayDay, kidsEnabled },
  };

  return rolloverIfNeeded(state, now);
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------

export function rolloverIfNeeded(state: WawetState, now: Date = new Date()): WawetState {
  const date = todayLocalDate(now);
  if (state.today.date === date) return state;
  // Yesterday's cards join the recent list so the new day never re-deals them
  // while an alternative exists (see varietyPick).
  const recent: RecentSuggestions = {
    family: pushRecent(state.recent.family, state.today.suggestionId),
    kids: pushRecent(state.recent.kids, state.today.kidsSuggestionId),
  };
  return {
    ...state,
    recent,
    today: {
      date,
      suggestionId: varietyPick("family", state.pantry, state.customMeals, recent.family, date, state.hiddenSeededMeals),
      kidsSuggestionId: varietyPick("kids", state.pantry, state.customMeals, recent.kids, date, state.hiddenSeededMeals),
      shufflesUsed: 0,
      view: state.settings.kidsEnabled ? state.today.view : "family",
      takeawaySkipped: false,
    },
  };
}

export function canShuffle(state: WawetState): boolean {
  if (state.today.shufflesUsed >= MAX_SHUFFLES) return false;
  // The shuffle can ALWAYS deal as long as the view's full pool has another
  // card: when the pantry narrows the eligible pool to one (or zero) meals,
  // the deal extends past it rather than dying with no explanation. The card
  // itself says when a dealt meal does not match the pantry.
  return fullIds(state.today.view, state.customMeals, state.hiddenSeededMeals).length > 1;
}

/** Does this meal's every hero ingredient hold a tick right now? */
export function mealMatchesPantry(
  pantry: Record<string, boolean>,
  meal: { ingredients: string[] },
): boolean {
  return meal.ingredients.every((ing) => pantry[ing] === true);
}

/** The id the next shuffle will deal, or null when no shuffle is possible.
 * Shared by shuffle() and peekNextSuggestion() so the card shown peeking
 * under the deck can never differ from the card the shuffle actually deals. */
function nextShuffleId(state: WawetState): string | null {
  if (!canShuffle(state)) return null;
  const { view, date } = state.today;
  const n = state.today.shufflesUsed + 1;
  const current = view === "family" ? state.today.suggestionId : state.today.kidsSuggestionId;
  // Deal from the pantry-matched pool first; when that leaves nothing to deal
  // (eligible is empty OR exactly the current card), extend to the full pool
  // so the deck never goes dead mid-day.
  let pool = eligibleIds(view, state.pantry, state.customMeals, state.hiddenSeededMeals)
    .filter((id) => id !== current);
  if (pool.length === 0) {
    pool = fullIds(view, state.customMeals, state.hiddenSeededMeals).filter((id) => id !== current);
  }
  return pick(pool, `${date}:${view}:${n}`);
}

export function peekNextSuggestion(state: WawetState) {
  const id = nextShuffleId(state);
  return id === null ? null : resolveMeal(state, id);
}

export function shuffle(state: WawetState): WawetState {
  const next = nextShuffleId(state);
  if (next === null) return state;
  const { view } = state.today;
  const n = state.today.shufflesUsed + 1;
  return {
    ...state,
    today: {
      ...state.today,
      shufflesUsed: n,
      ...(view === "family" ? { suggestionId: next } : { kidsSuggestionId: next }),
    },
  };
}

export function setView(state: WawetState, view: MealKind): WawetState {
  if (view === "kids" && !state.settings.kidsEnabled) return state;
  return { ...state, today: { ...state.today, view } };
}

export function skipTakeaway(state: WawetState): WawetState {
  return { ...state, today: { ...state.today, takeawaySkipped: true } };
}

export function restoreTakeaway(state: WawetState): WawetState {
  return { ...state, today: { ...state.today, takeawaySkipped: false } };
}

export function isTakeawayToday(state: WawetState, now: Date = new Date()): boolean {
  return state.settings.takeawayDay !== null && weekdayName(now) === state.settings.takeawayDay;
}

/** Re-evaluate both stored suggestions after a pantry change (free re-picks). */
function reevaluateSuggestions(state: WawetState): WawetState {
  const { date, shufflesUsed } = state.today;
  const revalidate = (kind: MealKind, current: string): string => {
    const active = activeIds(kind, state.pantry, state.customMeals, state.hiddenSeededMeals);
    if (active.includes(current)) return current;
    return pick(active, `${date}:${kind}:${shufflesUsed}`);
  };
  return {
    ...state,
    today: {
      ...state.today,
      suggestionId: revalidate("family", state.today.suggestionId),
      kidsSuggestionId: revalidate("kids", state.today.kidsSuggestionId),
    },
  };
}

export function togglePantry(state: WawetState, ingredientId: string): WawetState {
  if (!(ingredientId in state.pantry)) return state;
  const pantry: Record<string, boolean> = Object.create(null);
  Object.assign(pantry, state.pantry);
  pantry[ingredientId] = !pantry[ingredientId];
  // Selection is a draft: the dish only changes when the user hits Save.
  return { ...state, pantry };
}

/** Commit the current pantry selection: re-match tonight's dish against it. */
export function commitPantry(state: WawetState): WawetState {
  return reevaluateSuggestions(state);
}

/**
 * Apply a draft of tick overrides and commit in one step. The pantry screen
 * keeps its toggles in local component state (a real draft: Back discards),
 * and only this call writes them through.
 */
export function applyPantryOverrides(
  state: WawetState,
  overrides: Record<string, boolean>,
): WawetState {
  const pantry: Record<string, boolean> = Object.create(null);
  for (const id of Object.keys(state.pantry)) {
    pantry[id] = Object.prototype.hasOwnProperty.call(overrides, id)
      ? overrides[id] === true
      : state.pantry[id];
  }
  return commitPantry({ ...state, pantry });
}

export type SaveResult =
  | { ok: true; state: WawetState }
  | { ok: false; error: string };

/** @deprecated old name kept for callers; same shape as SaveResult. */
export type AddIngredientResult = SaveResult;

export function generateId(): string {
  return `c-${crypto.randomUUID()}`;
}

export function generateMealId(): string {
  return `m-${crypto.randomUUID()}`;
}

export type AddMealInput = {
  name: string;
  description?: string;
  kind: MealKind;
  ingredients: string[];
};

export function addCustomMeal(
  state: WawetState,
  input: AddMealInput,
  id: string = generateMealId(),
): SaveResult {
  const name = stripControl(input.name);
  if (name.length === 0) return { ok: false, error: "Give it a name first." };
  if (name.length > MAX_INGREDIENT_NAME_LENGTH) {
    return { ok: false, error: `Keep it under ${MAX_INGREDIENT_NAME_LENGTH} characters.` };
  }
  if (state.customMeals.length >= MAX_CUSTOM_MEALS) {
    return { ok: false, error: "That's plenty of meals already." };
  }
  const lower = name.toLowerCase();
  const taken =
    meals.some((m) => m.name.toLowerCase() === lower) ||
    state.customMeals.some((m) => m.name.toLowerCase() === lower);
  if (taken) return { ok: false, error: "You already have that meal." };

  const known = new Set([
    ...seededIngredients.map((i) => i.id),
    ...state.customIngredients.map((i) => i.id),
  ]);
  const ingredients = [...new Set(input.ingredients.filter((i) => known.has(i)))];
  const description = stripControl(input.description ?? "").slice(0, MAX_MEAL_DESCRIPTION_LENGTH);

  return {
    ok: true,
    state: {
      ...state,
      customMeals: [
        ...state.customMeals,
        { id, name, description, kind: input.kind, ingredients },
      ],
    },
  };
}

export function updateCustomMeal(
  state: WawetState,
  id: string,
  input: AddMealInput,
): SaveResult {
  const existing = state.customMeals.find((m) => m.id === id);
  if (!existing) return { ok: false, error: "That meal no longer exists." };
  const name = stripControl(input.name);
  if (name.length === 0) return { ok: false, error: "Give it a name first." };
  if (name.length > MAX_INGREDIENT_NAME_LENGTH) {
    return { ok: false, error: `Keep it under ${MAX_INGREDIENT_NAME_LENGTH} characters.` };
  }
  const lower = name.toLowerCase();
  const taken =
    meals.some((m) => m.name.toLowerCase() === lower) ||
    state.customMeals.some((m) => m.id !== id && m.name.toLowerCase() === lower);
  if (taken) return { ok: false, error: "You already have that meal." };

  const known = new Set([
    ...seededIngredients.map((i) => i.id),
    ...state.customIngredients.map((i) => i.id),
  ]);
  const ingredients = [...new Set(input.ingredients.filter((i) => known.has(i)))];
  const description = stripControl(input.description ?? "").slice(0, MAX_MEAL_DESCRIPTION_LENGTH);

  const next = {
    ...state,
    customMeals: state.customMeals.map((m) =>
      m.id === id ? { id, name, description, kind: input.kind, ingredients } : m,
    ),
  };
  // A kind change can empty the old view (all built-ins hidden, this was the
  // last custom meal there): restore that view's built-ins before repairing.
  const guarded = {
    ...next,
    hiddenSeededMeals: dropHiddenForEmptyViews(next.hiddenSeededMeals, next.customMeals),
  };
  // TARGETED repair only: a kind change can strand this meal's own stored
  // suggestion in the wrong view's pool. Blanket revalidation would also
  // replace intentionally dealt off-pantry suggestions on unrelated edits.
  return { ok: true, state: repairSuggestionForMeal(guarded, id) };
}

/** Re-pick a view's suggestion ONLY if it points at this meal and the meal
 * has left that view's pool (deleted, or moved to the other kind). */
function repairSuggestionForMeal(state: WawetState, mealId: string): WawetState {
  const { date, shufflesUsed } = state.today;
  const repair = (kind: MealKind, current: string): string => {
    if (current !== mealId) return current;
    const full = fullIds(kind, state.customMeals, state.hiddenSeededMeals);
    if (full.includes(current)) return current;
    return pick(
      activeIds(kind, state.pantry, state.customMeals, state.hiddenSeededMeals),
      `${date}:${kind}:${shufflesUsed}`,
    );
  };
  const suggestionId = repair("family", state.today.suggestionId);
  const kidsSuggestionId = repair("kids", state.today.kidsSuggestionId);
  if (
    suggestionId === state.today.suggestionId &&
    kidsSuggestionId === state.today.kidsSuggestionId
  ) {
    return state;
  }
  return { ...state, today: { ...state.today, suggestionId, kidsSuggestionId } };
}

/**
 * Hide or show a built-in meal. Hidden meals never get suggested or dealt.
 * Hiding tonight's dish re-picks it for free (same discipline as deletion);
 * the last visible meal of a view can never be hidden.
 */
export function setSeededMealHidden(
  state: WawetState,
  id: string,
  hidden: boolean,
): SaveResult {
  const meal = seededMealFor(id);
  if (!meal) return { ok: false, error: "That meal no longer exists." };
  const isHidden = state.hiddenSeededMeals.includes(id);
  if (hidden === isHidden) return { ok: true, state };
  if (!hidden) {
    return {
      ok: true,
      state: { ...state, hiddenSeededMeals: state.hiddenSeededMeals.filter((x) => x !== id) },
    };
  }
  const nextHidden = [...state.hiddenSeededMeals, id];
  if (fullIds(meal.kind, state.customMeals, nextHidden).length === 0) {
    return { ok: false, error: "Keep at least one meal in this view." };
  }
  const next = { ...state, hiddenSeededMeals: nextHidden };
  return { ok: true, state: repairSuggestionForMeal(next, id) };
}

export function removeCustomMeal(state: WawetState, id: string): WawetState {
  if (!state.customMeals.some((m) => m.id === id)) return state;
  const next = { ...state, customMeals: state.customMeals.filter((m) => m.id !== id) };
  // Deleting the last custom meal of a view whose built-ins are all hidden
  // would empty the pool: restore that view's built-ins first.
  const guarded = {
    ...next,
    hiddenSeededMeals: dropHiddenForEmptyViews(next.hiddenSeededMeals, next.customMeals),
  };
  // If the removed meal is tonight's suggestion in either view, re-pick for
  // free - and touch nothing else (see repairSuggestionForMeal).
  return repairSuggestionForMeal(guarded, id);
}

export function addCustomIngredient(
  state: WawetState,
  rawName: string,
  category: Category,
  id: string = generateId(),
): SaveResult {
  const name = rawName.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  if (name.length === 0) return { ok: false, error: "Give it a name first." };
  if (name.length > MAX_INGREDIENT_NAME_LENGTH) {
    return { ok: false, error: `Keep it under ${MAX_INGREDIENT_NAME_LENGTH} characters.` };
  }
  if (state.customIngredients.length >= MAX_CUSTOM_INGREDIENTS) {
    return { ok: false, error: "That's plenty of items already." };
  }
  const lower = name.toLowerCase();
  const taken =
    seededIngredients.some((i) => i.name.toLowerCase() === lower) ||
    state.customIngredients.some((i) => i.name.toLowerCase() === lower);
  if (taken) return { ok: false, error: "You already have that item." };

  const pantry: Record<string, boolean> = Object.create(null);
  Object.assign(pantry, state.pantry);
  pantry[id] = true;
  return {
    ok: true,
    state: {
      ...state,
      pantry,
      customIngredients: [...state.customIngredients, { id, name, category }],
    },
  };
}

export function setTakeawayDay(state: WawetState, day: Weekday | null, now: Date = new Date()): WawetState {
  const next: WawetState = { ...state, settings: { ...state.settings, takeawayDay: day } };
  // Normalization: if today is no longer a takeaway day, a stale skip makes no sense.
  if (!isTakeawayToday(next, now)) {
    return { ...next, today: { ...next.today, takeawaySkipped: false } };
  }
  return next;
}

export function setKidsEnabled(state: WawetState, enabled: boolean): WawetState {
  return {
    ...state,
    settings: { ...state.settings, kidsEnabled: enabled },
    today: { ...state.today, view: enabled ? state.today.view : "family" },
  };
}

export function resetShuffles(state: WawetState): WawetState {
  return { ...state, today: { ...state.today, shufflesUsed: 0 } };
}

// ---------------------------------------------------------------------------
// Storage — every localStorage access wrapped (SecurityError / quota safe)
// ---------------------------------------------------------------------------

export function loadState(now: Date = new Date()): WawetState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return freshState(now);
  }
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Old-key cleanup is best-effort; never block loading on it.
  }
  return parseState(raw, now);
}

export function saveState(state: WawetState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota/security failure: keep running in-memory only.
  }
}
