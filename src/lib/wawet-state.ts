import {
  type Category,
  type MealKind,
  type Weekday,
  CATEGORIES,
  WEEKDAYS,
  familyMeals,
  kidsMeals,
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

export type Settings = {
  takeawayDay: Weekday | null;
  kidsEnabled: boolean;
};

export type WawetState = {
  version: 1;
  today: TodayState;
  pantry: Record<string, boolean>;
  customIngredients: CustomIngredient[];
  settings: Settings;
};

export const STORAGE_KEY = "wawet-state-v1";
export const LEGACY_STORAGE_KEY = "dinner-time-next-state-v3";
export const MAX_SHUFFLES = 3;
export const MAX_CUSTOM_INGREDIENTS = 200;
export const MAX_INGREDIENT_NAME_LENGTH = 60;

const CUSTOM_ID_RE =
  /^c-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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

function poolFor(kind: MealKind) {
  return kind === "family" ? familyMeals : kidsMeals;
}

export function eligibleIds(kind: MealKind, pantry: Record<string, boolean>): string[] {
  return poolFor(kind)
    .filter((meal) => meal.ingredients.every((ing) => pantry[ing] !== false))
    .map((meal) => meal.id);
}

export function fullIds(kind: MealKind): string[] {
  return poolFor(kind).map((meal) => meal.id);
}

export function isFallback(kind: MealKind, pantry: Record<string, boolean>): boolean {
  return eligibleIds(kind, pantry).length === 0;
}

/** Eligible pool, or the full pool when the eligible pool is empty (fallback mode). */
function activeIds(kind: MealKind, pantry: Record<string, boolean>): string[] {
  const eligible = eligibleIds(kind, pantry);
  return eligible.length > 0 ? eligible : fullIds(kind);
}

function dailyPick(
  kind: MealKind,
  pantry: Record<string, boolean>,
  date: string,
  salt: number,
): string {
  return pick(activeIds(kind, pantry), `${date}:${kind}:${salt}`);
}

// ---------------------------------------------------------------------------
// Fresh state
// ---------------------------------------------------------------------------

function defaultPantry(customIngredients: CustomIngredient[] = []): Record<string, boolean> {
  const pantry: Record<string, boolean> = Object.create(null);
  for (const ing of seededIngredients) pantry[ing.id] = true;
  for (const ing of customIngredients) pantry[ing.id] = true;
  return pantry;
}

export function freshState(now: Date = new Date()): WawetState {
  const date = todayLocalDate(now);
  const pantry = defaultPantry();
  return {
    version: 1,
    today: {
      date,
      suggestionId: dailyPick("family", pantry, date, 0),
      kidsSuggestionId: dailyPick("kids", pantry, date, 0),
      shufflesUsed: 0,
      view: "family",
      takeawaySkipped: false,
    },
    pantry,
    customIngredients: [],
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
  const pantry: Record<string, boolean> = Object.create(null);
  for (const ing of seededIngredients) {
    pantry[ing.id] = rawPantry[ing.id] !== false;
  }
  for (const ing of customIngredients) {
    pantry[ing.id] = rawPantry[ing.id] !== false;
  }

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

  // Suggestion ids: repair dangling OR ineligible ids with the current salt.
  const repair = (kind: MealKind, id: unknown): string => {
    const active = activeIds(kind, pantry);
    if (typeof id === "string" && active.includes(id)) return id;
    return pick(active, `${date}:${kind}:${shufflesUsed}`);
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
  return {
    ...state,
    today: {
      date,
      suggestionId: dailyPick("family", state.pantry, date, 0),
      kidsSuggestionId: dailyPick("kids", state.pantry, date, 0),
      shufflesUsed: 0,
      view: state.settings.kidsEnabled ? state.today.view : "family",
      takeawaySkipped: false,
    },
  };
}

export function canShuffle(state: WawetState): boolean {
  if (state.today.shufflesUsed >= MAX_SHUFFLES) return false;
  const active = activeIds(state.today.view, state.pantry);
  return active.length > 1;
}

export function shuffle(state: WawetState): WawetState {
  if (!canShuffle(state)) return state;
  const { view, date } = state.today;
  const n = state.today.shufflesUsed + 1;
  const current = view === "family" ? state.today.suggestionId : state.today.kidsSuggestionId;
  const poolMinusCurrent = activeIds(view, state.pantry).filter((id) => id !== current);
  const next = pick(poolMinusCurrent, `${date}:${view}:${n}`);
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
    const active = activeIds(kind, state.pantry);
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
  return reevaluateSuggestions({ ...state, pantry });
}

export type AddIngredientResult =
  | { ok: true; state: WawetState }
  | { ok: false; error: string };

export function generateId(): string {
  return `c-${crypto.randomUUID()}`;
}

export function addCustomIngredient(
  state: WawetState,
  rawName: string,
  category: Category,
  id: string = generateId(),
): AddIngredientResult {
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
