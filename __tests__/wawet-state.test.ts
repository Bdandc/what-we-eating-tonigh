import { afterEach, describe, expect, it } from "vitest";
import {
  LIKELY_STOCKED,
  familyMeals,
  kidsMeals,
  meals,
  seededIngredients,
} from "@/lib/wawet-data";
import {
  LEGACY_STORAGE_KEY,
  MAX_CUSTOM_INGREDIENTS,
  MAX_CUSTOM_MEALS,
  MAX_SHUFFLES,
  STORAGE_KEY,
  type WawetState,
  addCustomIngredient,
  addCustomMeal,
  canShuffle,
  eligibleIds,
  freshState,
  fullIds,
  generateId,
  generateMealId,
  isFallback,
  isTakeawayToday,
  loadState,
  parseState,
  pick,
  removeCustomMeal,
  resetShuffles,
  resolveMeal,
  restoreTakeaway,
  rolloverIfNeeded,
  saveState,
  setKidsEnabled,
  setTakeawayDay,
  setView,
  shuffle,
  skipTakeaway,
  applyPantryOverrides,
  commitPantry,
  mealMatchesPantry,
  peekNextSuggestion,
  togglePantry,
  todayLocalDate,
  weekdayName,
} from "@/lib/wawet-state";

// 2026-07-28 was a Tuesday; 2026-07-30 a Thursday.
const TUESDAY = new Date(2026, 6, 28, 12, 0, 0);
const THURSDAY = new Date(2026, 6, 30, 12, 0, 0);

function currentId(state: WawetState): string {
  return state.today.view === "family"
    ? state.today.suggestionId
    : state.today.kidsSuggestionId;
}

describe("wawet-data invariants", () => {
  it("family and kids pools are disjoint by construction", () => {
    const familyIds = new Set(familyMeals.map((m) => m.id));
    for (const meal of kidsMeals) expect(familyIds.has(meal.id)).toBe(false);
  });

  it("takeaway-night is not a meal (takeaway is a day-mode)", () => {
    expect(meals.some((m) => m.id === "takeaway-night")).toBe(false);
  });

  it("every meal ingredient maps to a seeded ingredient id", () => {
    const known = new Set(seededIngredients.map((i) => i.id));
    for (const meal of meals) {
      for (const ing of meal.ingredients) expect(known.has(ing)).toBe(true);
    }
  });

  it("every seeded meal names a hero item, so the pantry always has an effect", () => {
    expect(meals.every((m) => m.ingredients.length > 0)).toBe(true);
  });

  it("no pantry item is a dead tick: every one is needed by some meal", () => {
    const used = new Set(meals.flatMap((m) => m.ingredients));
    const orphans = seededIngredients.filter((i) => !used.has(i.id)).map((i) => i.name);
    expect(orphans).toEqual([]);
  });

  it("no meal needs an ingredient that does not exist", () => {
    const known = new Set(seededIngredients.map((i) => i.id));
    const dangling = meals.flatMap((m) => m.ingredients).filter((id) => !known.has(id));
    expect(dangling).toEqual([]);
  });

  it("meal names are unique across pools (custom-meal dupe errors stay sane)", () => {
    const names = meals.map((m) => m.name.toLowerCase());
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });

  it("the pre-filled staples exist and cover at least two meals per pool", () => {
    const known = new Set(seededIngredients.map((i) => i.id));
    for (const id of LIKELY_STOCKED) expect(known.has(id)).toBe(true);
    const likely = new Set(LIKELY_STOCKED);
    const covered = (pool: typeof meals) =>
      pool.filter((m) => m.ingredients.every((i) => likely.has(i))).length;
    expect(covered(familyMeals)).toBeGreaterThanOrEqual(2);
    expect(covered(kidsMeals)).toBeGreaterThanOrEqual(2);
  });
});

describe("dates", () => {
  it("formats local dates with manual zero padding", () => {
    expect(todayLocalDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(todayLocalDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("maps JS day numbers to Monday-first weekday names", () => {
    expect(weekdayName(TUESDAY)).toBe("Tuesday");
    expect(weekdayName(THURSDAY)).toBe("Thursday");
    expect(weekdayName(new Date(2026, 6, 26))).toBe("Sunday");
  });
});

describe("deterministic pick", () => {
  it("is stable for the same seed and pool regardless of input order", () => {
    const a = pick(["b", "a", "c"], "2026-07-30:family:0");
    const b = pick(["c", "b", "a"], "2026-07-30:family:0");
    expect(a).toBe(b);
  });

  it("differs across salts often enough to be a real shuffle", () => {
    const pool = familyMeals.map((m) => m.id);
    const picks = new Set([0, 1, 2, 3].map((n) => pick(pool, `2026-07-30:family:${n}`)));
    expect(picks.size).toBeGreaterThan(1);
  });

  it("throws on an empty pool rather than returning garbage", () => {
    expect(() => pick([], "seed")).toThrow();
  });
});

describe("freshState defaults", () => {
  it("pins the documented defaults", () => {
    const s = freshState(THURSDAY);
    expect(s.version).toBe(1);
    expect(s.settings).toEqual({ takeawayDay: "Tuesday", kidsEnabled: true });
    expect(s.today.view).toBe("family");
    expect(s.today.shufflesUsed).toBe(0);
    expect(s.today.takeawaySkipped).toBe(false);
    expect(s.today.date).toBe("2026-07-30");
    expect(s.customIngredients).toEqual([]);
    const likely = new Set(LIKELY_STOCKED);
    for (const ing of seededIngredients) {
      expect(s.pantry[ing.id]).toBe(likely.has(ing.id));
    }
  });

  it("daily picks are deterministic per date and come from the right pools", () => {
    const a = freshState(THURSDAY);
    const b = freshState(new Date(2026, 6, 30, 23, 59));
    expect(a.today.suggestionId).toBe(b.today.suggestionId);
    expect(a.today.kidsSuggestionId).toBe(b.today.kidsSuggestionId);
    expect(familyMeals.some((m) => m.id === a.today.suggestionId)).toBe(true);
    expect(kidsMeals.some((m) => m.id === a.today.kidsSuggestionId)).toBe(true);
  });
});

describe("shuffle", () => {
  it("changes only the viewed suggestion, never repeats immediately, and caps at 3", () => {
    let s = freshState(THURSDAY);
    const kidsBefore = s.today.kidsSuggestionId;
    for (let n = 1; n <= MAX_SHUFFLES; n++) {
      const before = currentId(s);
      s = shuffle(s);
      expect(s.today.shufflesUsed).toBe(n);
      expect(currentId(s)).not.toBe(before);
      expect(s.today.kidsSuggestionId).toBe(kidsBefore);
    }
    expect(canShuffle(s)).toBe(false);
    const capped = shuffle(s);
    expect(capped).toBe(s);
  });

  it("shares one budget across family and kids views", () => {
    let s = freshState(THURSDAY);
    s = shuffle(s);
    s = setView(s, "kids");
    s = shuffle(s);
    s = shuffle(s);
    expect(s.today.shufflesUsed).toBe(3);
    expect(canShuffle(s)).toBe(false);
    s = setView(s, "family");
    expect(canShuffle(s)).toBe(false);
  });

  it("is deterministic: the same sequence of actions yields the same meals", () => {
    const run = () => {
      let s = freshState(THURSDAY);
      s = shuffle(s);
      s = shuffle(s);
      return currentId(s);
    };
    expect(run()).toBe(run());
  });
});

/** Tick every seeded ingredient, mirroring a user selecting the whole pantry. */
function selectAll(state: WawetState): WawetState {
  let out = state;
  for (const ing of seededIngredients) {
    if (out.pantry[ing.id] !== true) out = togglePantry(out, ing.id);
  }
  return out;
}

/** Untick everything, giving a genuinely empty pantry. */
function deselectAll(state: WawetState): WawetState {
  let out = state;
  for (const ing of seededIngredients) {
    if (out.pantry[ing.id] === true) out = togglePantry(out, ing.id);
  }
  return out;
}

describe("peekNextSuggestion", () => {
  it("always shows exactly the card the next shuffle deals", () => {
    let s = selectAll(freshState(THURSDAY));
    for (let n = 0; n < MAX_SHUFFLES; n++) {
      const peeked = peekNextSuggestion(s);
      s = shuffle(s);
      expect(peeked?.id).toBe(currentId(s));
    }
  });

  it("is null once shuffles are exhausted", () => {
    let s = selectAll(freshState(THURSDAY));
    for (let n = 0; n < MAX_SHUFFLES; n++) s = shuffle(s);
    expect(peekNextSuggestion(s)).toBeNull();
  });

  it("peeks the kids pool when the kids view is active", () => {
    let s = selectAll(freshState(THURSDAY));
    s = setView(s, "kids");
    const peeked = peekNextSuggestion(s);
    expect(peeked).not.toBeNull();
    s = shuffle(s);
    expect(peeked?.id).toBe(s.today.kidsSuggestionId);
  });
});

describe("pantry filter + invalidation", () => {
  it("only meals whose ingredients are all selected are eligible", () => {
    const all = selectAll(freshState(THURSDAY));
    const everything = eligibleIds("family", all.pantry);
    expect([...everything].sort()).toEqual(familyMeals.map((m) => m.id).sort());

    const withoutChicken = commitPantry(togglePantry(all, "chicken"));
    const ids = eligibleIds("family", withoutChicken.pantry);
    const chickenMeals = familyMeals.filter((m) => m.ingredients.includes("chicken"));
    expect(chickenMeals.length).toBeGreaterThan(0);
    for (const meal of chickenMeals) expect(ids).not.toContain(meal.id);
    // Meals that never needed chicken are untouched.
    expect(ids).toContain("pizza-night");
  });

  it("an empty pantry is fallback mode, and still suggests from the full pool", () => {
    const s = deselectAll(freshState(THURSDAY));
    expect(eligibleIds("family", s.pantry)).toEqual([]);
    expect(isFallback("family", s.pantry)).toBe(true);
    // Never a dead end: repairing a dangling id against an empty pantry still
    // resolves to a real meal from the full pool.
    const raw = JSON.stringify({ ...s, today: { ...s.today, suggestionId: "deleted-meal" } });
    const repaired = parseState(raw, THURSDAY);
    expect(familyMeals.some((m) => m.id === repaired.today.suggestionId)).toBe(true);
  });

  it("a full pantry leaves fallback mode", () => {
    const all = selectAll(freshState(THURSDAY));
    expect(isFallback("family", all.pantry)).toBe(false);
    expect(isFallback("kids", all.pantry)).toBe(false);
  });

  it("selecting an ingredient does not move the dish until it is committed", () => {
    const all = selectAll(freshState(THURSDAY));
    const mapped = familyMeals.find((m) => m.ingredients.length > 0)!;
    const s = { ...all, today: { ...all.today, suggestionId: mapped.id } };
    const toggled = togglePantry(s, mapped.ingredients[0]);
    expect(toggled.today.suggestionId).toBe(mapped.id);
    expect(commitPantry(toggled).today.suggestionId).not.toBe(mapped.id);
  });

  it("applyPantryOverrides writes only known ids, coerces to boolean, and commits", () => {
    const all = selectAll(freshState(THURSDAY));
    const mapped = familyMeals.find((m) => m.ingredients.length > 0)!;
    const s = { ...all, today: { ...all.today, suggestionId: mapped.id } };
    const applied = applyPantryOverrides(s, {
      [mapped.ingredients[0]]: false,
      "rogue-key": true,
      __proto__: true,
    } as Record<string, boolean>);
    expect(applied.pantry[mapped.ingredients[0]]).toBe(false);
    expect("rogue-key" in applied.pantry).toBe(false);
    // Commit happened: the now-ineligible dish was re-picked for free.
    expect(applied.today.suggestionId).not.toBe(mapped.id);
    expect(applied.today.shufflesUsed).toBe(s.today.shufflesUsed);
  });

  it("re-picks the current suggestion for free when it becomes ineligible, in both views", () => {
    let s = selectAll(freshState(THURSDAY));
    // Force a known current: find an ingredient the family suggestion depends on,
    // or force one by shuffling to a mapped meal via direct construction.
    const mapped = familyMeals.find((m) => m.ingredients.length > 0)!;
    s = {
      ...s,
      today: { ...s.today, suggestionId: mapped.id },
    };
    const shufflesBefore = s.today.shufflesUsed;
    const toggled = commitPantry(togglePantry(s, mapped.ingredients[0]));
    expect(toggled.today.suggestionId).not.toBe(mapped.id);
    expect(toggled.today.shufflesUsed).toBe(shufflesBefore);
    expect(eligibleIds("family", toggled.pantry)).toContain(toggled.today.suggestionId);

    const mappedKids = kidsMeals.find((m) => m.ingredients.length > 0)!;
    let k = selectAll(freshState(THURSDAY));
    k = { ...k, today: { ...k.today, kidsSuggestionId: mappedKids.id } };
    const kToggled = commitPantry(togglePantry(k, mappedKids.ingredients[0]));
    expect(kToggled.today.kidsSuggestionId).not.toBe(mappedKids.id);
  });

  it("keeps an eligible current suggestion untouched on unrelated pantry changes", () => {
    const s = freshState(THURSDAY);
    const unrelated = seededIngredients.find(
      (i) =>
        !meals.some((m) => m.id === s.today.suggestionId && m.ingredients.includes(i.id)) &&
        !meals.some((m) => m.id === s.today.kidsSuggestionId && m.ingredients.includes(i.id)),
    )!;
    const toggled = togglePantry(s, unrelated.id);
    expect(toggled.today.suggestionId).toBe(s.today.suggestionId);
    expect(toggled.today.kidsSuggestionId).toBe(s.today.kidsSuggestionId);
  });

  it("ignores unknown pantry ids", () => {
    const s = freshState(THURSDAY);
    expect(togglePantry(s, "__proto__")).toBe(s);
    expect(togglePantry(s, "not-a-thing")).toBe(s);
  });
});

describe("sparse eligible pools never kill the deck", () => {
  /** Pantry ticking exactly fish-and-chips' heroes: eligible family pool = 1. */
  function oneEligible(): WawetState {
    let s = deselectAll(freshState(THURSDAY));
    for (const id of ["fish", "chips", "garden-peas"]) s = togglePantry(s, id);
    s = commitPantry(s);
    return { ...s, today: { ...s.today, suggestionId: "fish-and-chips" } };
  }

  it("a one-meal eligible pool still shuffles, extending to the full pool", () => {
    let s = oneEligible();
    expect(eligibleIds("family", s.pantry)).toEqual(["fish-and-chips"]);
    expect(canShuffle(s)).toBe(true);
    const peeked = peekNextSuggestion(s);
    expect(peeked).not.toBeNull();
    s = shuffle(s);
    expect(s.today.shufflesUsed).toBe(1);
    expect(s.today.suggestionId).not.toBe("fish-and-chips");
    expect(s.today.suggestionId).toBe(peeked?.id);
  });

  it("mealMatchesPantry flags meals dealt beyond the eligible pool", () => {
    let s = oneEligible();
    expect(mealMatchesPantry(s.pantry, familyMeals.find((m) => m.id === "fish-and-chips")!)).toBe(true);
    s = shuffle(s);
    const dealt = familyMeals.find((m) => m.id === s.today.suggestionId)!;
    expect(mealMatchesPantry(s.pantry, dealt)).toBe(false);
  });

  it("the cap still holds when dealing from the extended pool", () => {
    let s = oneEligible();
    for (let n = 0; n < MAX_SHUFFLES; n++) s = shuffle(s);
    expect(s.today.shufflesUsed).toBe(MAX_SHUFFLES);
    expect(canShuffle(s)).toBe(false);
    expect(shuffle(s)).toBe(s);
  });
});

describe("legacy-state migration", () => {
  it("a pre-catalogue pantry (removed ids present) gets the staples ticked in", () => {
    const fresh = freshState(THURSDAY);
    const raw = JSON.stringify({
      ...fresh,
      pantry: { chicken: true, "cheese-sticks": true, "pizza-pockets": true },
    });
    const s = parseState(raw, THURSDAY);
    expect(s.pantry.chicken).toBe(true);
    for (const id of LIKELY_STOCKED) expect(s.pantry[id]).toBe(true);
    expect("cheese-sticks" in s.pantry).toBe(false);
  });

  it("a current-era pantry is NOT force-ticked (user unticks stay honored)", () => {
    const fresh = freshState(THURSDAY);
    const raw = JSON.stringify({ ...fresh, pantry: { chicken: true } });
    const s = parseState(raw, THURSDAY);
    expect(s.pantry.chicken).toBe(true);
    expect(s.pantry.pasta).toBe(false);
  });
});

describe("takeaway day", () => {
  it("detects the configured day and only that day", () => {
    const s = freshState(TUESDAY);
    expect(isTakeawayToday(s, TUESDAY)).toBe(true);
    expect(isTakeawayToday(s, THURSDAY)).toBe(false);
    expect(isTakeawayToday(setTakeawayDay(s, null, TUESDAY), TUESDAY)).toBe(false);
  });

  it("skip and restore round-trip without touching the shuffle budget", () => {
    let s = freshState(TUESDAY);
    s = skipTakeaway(s);
    expect(s.today.takeawaySkipped).toBe(true);
    expect(s.today.shufflesUsed).toBe(0);
    s = restoreTakeaway(s);
    expect(s.today.takeawaySkipped).toBe(false);
  });

  it("changing takeaway day away from today clears a stale skip", () => {
    let s = freshState(TUESDAY);
    s = skipTakeaway(s);
    s = setTakeawayDay(s, "Friday", TUESDAY);
    expect(s.today.takeawaySkipped).toBe(false);
  });
});

describe("settings", () => {
  it("disabling kids forces the family view", () => {
    let s = freshState(THURSDAY);
    s = setView(s, "kids");
    expect(s.today.view).toBe("kids");
    s = setKidsEnabled(s, false);
    expect(s.today.view).toBe("family");
    expect(setView(s, "kids").today.view).toBe("family");
  });

  it("reset shuffles keeps the current suggestions (stored ids are truth)", () => {
    let s = freshState(THURSDAY);
    s = shuffle(s);
    const id = s.today.suggestionId;
    s = resetShuffles(s);
    expect(s.today.shufflesUsed).toBe(0);
    expect(s.today.suggestionId).toBe(id);
  });
});

describe("rollover", () => {
  it("is a no-op on the same date", () => {
    const s = freshState(THURSDAY);
    expect(rolloverIfNeeded(s, THURSDAY)).toBe(s);
  });

  it("resets the day state but keeps pantry, settings, and view", () => {
    let s = freshState(TUESDAY);
    s = shuffle(s);
    s = skipTakeaway(s);
    s = setView(s, "kids");
    const rolled = rolloverIfNeeded(s, THURSDAY);
    expect(rolled.today.date).toBe("2026-07-30");
    expect(rolled.today.shufflesUsed).toBe(0);
    expect(rolled.today.takeawaySkipped).toBe(false);
    expect(rolled.today.view).toBe("kids");
    expect(rolled.pantry).toEqual(s.pantry);
    expect(rolled.settings).toEqual(s.settings);
  });

  it("forces family view on rollover when kids are disabled", () => {
    let s = freshState(TUESDAY);
    s = setView(s, "kids");
    s = { ...s, settings: { ...s.settings, kidsEnabled: false } };
    const rolled = rolloverIfNeeded(s, THURSDAY);
    expect(rolled.today.view).toBe("family");
  });
});

describe("parseState (untrusted input)", () => {
  const fresh = freshState(THURSDAY);

  it.each([
    ["null", null],
    ["garbage", "not json {{{"],
    ["a number", "42"],
    ["an array", "[1,2,3]"],
    ["wrong version", JSON.stringify({ ...fresh, version: 2 })],
    ["missing today", JSON.stringify({ version: 1, settings: fresh.settings })],
  ])("falls back to fresh defaults on %s", (_label, raw) => {
    const s = parseState(raw as string | null, THURSDAY);
    expect(s).toEqual(fresh);
  });

  it("round-trips a valid state", () => {
    let s = freshState(THURSDAY);
    s = shuffle(s);
    const back = parseState(JSON.stringify(s), THURSDAY);
    expect(back).toEqual(s);
  });

  it("clamps out-of-range shuffle counts", () => {
    const clamp = (n: unknown) =>
      parseState(JSON.stringify({ ...fresh, today: { ...fresh.today, shufflesUsed: n } }), THURSDAY)
        .today.shufflesUsed;
    expect(clamp(99)).toBe(MAX_SHUFFLES);
    expect(clamp(-5)).toBe(0);
    expect(clamp("nope")).toBe(0);
    expect(clamp(1.7)).toBe(1);
  });

  it("repairs dangling suggestion ids deterministically", () => {
    const s = parseState(
      JSON.stringify({ ...fresh, today: { ...fresh.today, suggestionId: "deleted-meal" } }),
      THURSDAY,
    );
    expect(familyMeals.some((m) => m.id === s.today.suggestionId)).toBe(true);
  });

  it("keeps a persisted suggestion the pantry excludes (drafts never re-pick on load)", () => {
    const mapped = familyMeals.find((m) => m.ingredients.length > 0)!;
    const full: Record<string, boolean> = {};
    for (const id of Object.keys(fresh.pantry)) full[id] = true;
    const raw = JSON.stringify({
      ...fresh,
      pantry: { ...full, [mapped.ingredients[0]]: false },
      today: { ...fresh.today, suggestionId: mapped.id },
    });
    const s = parseState(raw, THURSDAY);
    expect(s.today.suggestionId).toBe(mapped.id);
    // Committing the pantry is what re-picks it.
    expect(commitPantry(s).today.suggestionId).not.toBe(mapped.id);
  });

  it("forces family view when kids are disabled", () => {
    const raw = JSON.stringify({
      ...fresh,
      settings: { ...fresh.settings, kidsEnabled: false },
      today: { ...fresh.today, view: "kids" },
    });
    expect(parseState(raw, THURSDAY).today.view).toBe("family");
  });

  it("rebuilds pantry from the allowlist and survives __proto__/constructor keys", () => {
    const raw = JSON.stringify({
      ...fresh,
      pantry: {
        chicken: false,
        "__proto__": { polluted: true },
        constructor: { alsoBad: true },
        "rogue-key": true,
      },
    });
    const s = parseState(raw, THURSDAY);
    expect(s.pantry.chicken).toBe(false);
    expect("rogue-key" in s.pantry).toBe(false);
    expect(Object.keys(s.pantry)).not.toContain("__proto__");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("drops malformed, duplicate, over-long, and colliding custom ingredients", () => {
    const goodId = generateId();
    const raw = JSON.stringify({
      ...fresh,
      customIngredients: [
        { id: goodId, name: "Halloumi", category: "protein" },
        { id: "c-tampered", name: "Bad id", category: "veg" },
        { id: goodId, name: "Duplicate id", category: "veg" },
        { id: generateId(), name: "Halloumi", category: "misc" },
        { id: generateId(), name: "Chicken", category: "protein" },
        { id: generateId(), name: "x".repeat(61), category: "sides" },
        { id: generateId(), name: "OK Item", category: "not-a-category" },
      ],
    });
    const s = parseState(raw, THURSDAY);
    expect(s.customIngredients).toEqual([
      { id: goodId, name: "Halloumi", category: "protein" },
    ]);
    // No pantry entry persisted for it, so it comes back unselected.
    expect(s.pantry[goodId]).toBe(false);
  });

  it("rolls over a state persisted on an earlier date", () => {
    const old = freshState(TUESDAY);
    const s = parseState(JSON.stringify(old), THURSDAY);
    expect(s.today.date).toBe("2026-07-30");
    expect(s.today.shufflesUsed).toBe(0);
  });
});

describe("addCustomIngredient", () => {
  const s = freshState(THURSDAY);

  it("adds a valid item with a well-formed opaque id, marked as have", () => {
    const result = addCustomIngredient(s, "  Halloumi  ", "protein");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const added = result.state.customIngredients[0];
    expect(added.name).toBe("Halloumi");
    expect(added.id).toMatch(/^c-[0-9a-f-]{36}$/);
    expect(result.state.pantry[added.id]).toBe(true);
  });

  it("accepts non-Latin names (id is opaque, not a slug)", () => {
    const result = addCustomIngredient(s, "кашкавал", "misc");
    expect(result.ok).toBe(true);
  });

  it("strips control characters", () => {
    const result = addCustomIngredient(s, "Hal\u0000lou\u001fmi", "protein");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.customIngredients[0].name).toBe("Halloumi");
  });

  it.each([
    ["empty", ""],
    ["whitespace only", "   "],
    ["over 60 chars", "x".repeat(61)],
    ["a seeded name (case-insensitive)", "cHiCkEn"],
  ])("rejects %s", (_label, name) => {
    expect(addCustomIngredient(s, name, "veg").ok).toBe(false);
  });

  it("rejects duplicates of existing custom items", () => {
    const first = addCustomIngredient(s, "Halloumi", "protein");
    if (!first.ok) throw new Error("setup failed");
    expect(addCustomIngredient(first.state, "halloumi", "veg").ok).toBe(false);
  });

  it("enforces the count cap", () => {
    let state = s;
    for (let i = 0; i < MAX_CUSTOM_INGREDIENTS; i++) {
      const r = addCustomIngredient(state, `Item ${i}`, "misc");
      if (!r.ok) throw new Error(`setup failed at ${i}`);
      state = r.state;
    }
    expect(addCustomIngredient(state, "One Too Many", "misc").ok).toBe(false);
  });
});

describe("storage wrapping", () => {
  type StorageStub = {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
  };
  const originalWindow = (globalThis as { window?: unknown }).window;

  function stubWindow(storage: StorageStub) {
    (globalThis as { window?: unknown }).window = { localStorage: storage };
  }

  afterEach(() => {
    (globalThis as { window?: unknown }).window = originalWindow;
  });

  it("loads persisted state and clears the legacy key", () => {
    const persisted = freshState(THURSDAY);
    const removed: string[] = [];
    stubWindow({
      getItem: (key) => (key === STORAGE_KEY ? JSON.stringify(persisted) : null),
      setItem: () => {},
      removeItem: (key) => removed.push(key),
    });
    const s = loadState(THURSDAY);
    expect(s).toEqual(persisted);
    expect(removed).toContain(LEGACY_STORAGE_KEY);
  });

  it.each([
    ["getItem", { getItem: () => { throw new Error("SecurityError"); }, setItem: () => {}, removeItem: () => {} }],
    ["removeItem", { getItem: () => null, setItem: () => {}, removeItem: () => { throw new Error("SecurityError"); } }],
  ])("survives %s throwing", (_label, storage) => {
    stubWindow(storage as StorageStub);
    expect(loadState(THURSDAY)).toEqual(freshState(THURSDAY));
  });

  it("survives setItem throwing (quota)", () => {
    stubWindow({
      getItem: () => null,
      setItem: () => { throw new Error("QuotaExceededError"); },
      removeItem: () => {},
    });
    expect(() => saveState(freshState(THURSDAY))).not.toThrow();
  });
});

describe("custom meals", () => {
  const THURSDAY2 = new Date(2026, 6, 30, 12, 0, 0);
  const base = freshState(THURSDAY2);

  function withMeal(name = "Shopska Salad", kind: "family" | "kids" = "family", ingredients: string[] = []) {
    const result = addCustomMeal(base, { name, kind, ingredients });
    if (!result.ok) throw new Error(result.error);
    return result.state;
  }

  it("joins only its own kind's pool with an opaque m- id", () => {
    const s = withMeal();
    const meal = s.customMeals[0];
    expect(meal.id).toMatch(/^m-[0-9a-f-]{36}$/);
    expect(fullIds("family", s.customMeals)).toContain(meal.id);
    expect(fullIds("kids", s.customMeals)).not.toContain(meal.id);
    expect(eligibleIds("family", s.pantry, s.customMeals)).toContain(meal.id);
  });

  it("rejects name collisions with seeded and custom meals, case-insensitively", () => {
    expect(addCustomMeal(base, { name: "lasagna", kind: "family", ingredients: [] }).ok).toBe(false);
    const s = withMeal();
    expect(addCustomMeal(s, { name: "SHOPSKA SALAD", kind: "kids", ingredients: [] }).ok).toBe(false);
  });

  it("prunes unknown ingredient ids on add", () => {
    const result = addCustomMeal(base, { name: "Mystery", kind: "family", ingredients: ["chicken", "not-real"] });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.customMeals[0].ingredients).toEqual(["chicken"]);
  });

  it("a custom ingredient gates a custom meal through the pantry filter", () => {
    const ing = addCustomIngredient(selectAll(base), "Halloumi", "protein");
    if (!ing.ok) throw new Error("setup");
    const halloumiId = ing.state.customIngredients[0].id;
    const meal = addCustomMeal(ing.state, { name: "Halloumi Bake", kind: "family", ingredients: [halloumiId] });
    if (!meal.ok) throw new Error("setup");
    let s = meal.state;
    const mealId = s.customMeals[0].id;
    expect(eligibleIds("family", s.pantry, s.customMeals)).toContain(mealId);
    s = { ...s, today: { ...s.today, suggestionId: mealId } };
    const toggled = commitPantry(togglePantry(s, halloumiId));
    expect(eligibleIds("family", toggled.pantry, toggled.customMeals)).not.toContain(mealId);
    expect(toggled.today.suggestionId).not.toBe(mealId);
    expect(toggled.today.shufflesUsed).toBe(s.today.shufflesUsed);
  });

  it("removing tonight's suggested custom meal re-picks for free", () => {
    let s = withMeal();
    const mealId = s.customMeals[0].id;
    s = { ...s, today: { ...s.today, suggestionId: mealId } };
    const removed = removeCustomMeal(s, mealId);
    expect(removed.customMeals).toEqual([]);
    expect(removed.today.suggestionId).not.toBe(mealId);
    expect(removed.today.shufflesUsed).toBe(s.today.shufflesUsed);
  });

  it("resolveMeal finds seeded and custom meals", () => {
    const s = withMeal();
    expect(resolveMeal(s, "lasagna-night")?.name).toBe("Lasagna");
    expect(resolveMeal(s, s.customMeals[0].id)?.name).toBe("Shopska Salad");
    expect(resolveMeal(s, "nope")).toBeNull();
  });

  it("round-trips through parseState and drops malformed entries", () => {
    const s = withMeal("Keeper", "kids", []);
    const raw = JSON.stringify({
      ...s,
      customMeals: [
        ...s.customMeals,
        { id: "m-tampered", name: "Bad id", kind: "family", description: "", ingredients: [] },
        { id: generateMealId(), name: "Lasagna", kind: "family", description: "", ingredients: [] },
        { id: generateMealId(), name: "Bad kind", kind: "brunch", description: "", ingredients: [] },
        { id: generateMealId(), name: "Pruned", kind: "family", description: "", ingredients: ["ghost-item"] },
      ],
    });
    const back = parseState(raw, THURSDAY2);
    const names = back.customMeals.map((m) => m.name);
    expect(names).toContain("Keeper");
    expect(names).toContain("Pruned");
    expect(names).not.toContain("Bad id");
    expect(names).not.toContain("Lasagna");
    expect(names).not.toContain("Bad kind");
    expect(back.customMeals.find((m) => m.name === "Pruned")?.ingredients).toEqual([]);
  });

  it("enforces the meal count cap", () => {
    let s = base;
    for (let i = 0; i < MAX_CUSTOM_MEALS; i++) {
      const r = addCustomMeal(s, { name: `Meal ${i}`, kind: "family", ingredients: [] });
      if (!r.ok) throw new Error(`setup failed at ${i}`);
      s = r.state;
    }
    expect(addCustomMeal(s, { name: "One Too Many", kind: "family", ingredients: [] }).ok).toBe(false);
  });
});
