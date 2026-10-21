import { describe, expect, it } from "vitest";
import {
  MAX_SHUFFLES,
  type WawetState,
  applyPantryOverrides,
  freshState,
  parseState,
  pick,
  resetShuffles,
  rolloverIfNeeded,
  setView,
  shuffle,
} from "@/lib/wawet-state";

function allTicked(s: WawetState): WawetState {
  return applyPantryOverrides(
    s,
    Object.fromEntries(Object.keys(s.pantry).map((id) => [id, true])),
  );
}

function dealDay(s: WawetState, view: "family" | "kids"): { s: WawetState; cards: string[] } {
  let st = setView(s, view);
  const key = view === "family" ? "suggestionId" : "kidsSuggestionId";
  const cards = [st.today[key]];
  for (let i = 0; i < MAX_SHUFFLES; i++) {
    st = shuffle(st);
    cards.push(st.today[key]);
  }
  return { s: st, cards };
}

describe("meal selection randomness", () => {
  it("never repeats a card within a day (all pantry modes, both views, a year)", () => {
    for (const full of [true, false]) {
      for (const view of ["family", "kids"] as const) {
        let s = freshState(new Date(2026, 0, 1, 12));
        if (full) s = allTicked(s);
        for (let d = 0; d < 365; d++) {
          if (d > 0) s = rolloverIfNeeded(s, new Date(2026, 0, 1 + d, 12));
          const day = dealDay(s, view);
          s = day.s;
          // Default pantry has only 4-5 eligible meals but the shuffle extends
          // to the full pool, so 4 distinct cards are always available.
          expect(new Set(day.cards).size).toBe(day.cards.length);
        }
      }
    }
  });

  it("shuffle never returns the current card, even when the pool is tiny", () => {
    let s = freshState(new Date(2026, 0, 1, 12));
    for (let d = 0; d < 60; d++) {
      if (d > 0) s = rolloverIfNeeded(s, new Date(2026, 0, 1 + d, 12));
      for (const view of ["family", "kids"] as const) {
        s = setView(s, view);
        const key = view === "family" ? "suggestionId" : "kidsSuggestionId";
        for (let i = 0; i < MAX_SHUFFLES; i++) {
          const before = s.today[key];
          s = shuffle(s);
          expect(s.today[key]).not.toBe(before);
        }
        s = resetShuffles(s);
      }
    }
  });

  it("day-to-day index parity no longer alternates (even pool, 365 days)", () => {
    const ids = Array.from({ length: 18 }, (_, i) => `m${String(i).padStart(2, "0")}`);
    const sorted = [...ids].sort();
    let same = 0;
    let prev = -1;
    let n = 0;
    for (let d = 0; d < 365; d++) {
      const date = new Date(2026, 0, 1 + d, 12);
      const key = todayKey(date);
      const idx = sorted.indexOf(pick(ids, `${key}:family:0`));
      if (prev >= 0) {
        n++;
        if (idx % 2 === prev % 2) same++;
      }
      prev = idx;
    }
    const rate = same / n;
    expect(rate).toBeGreaterThan(0.35);
    expect(rate).toBeLessThan(0.65);
  });

  it("shuffles 1-3 do not alternate parity every day", () => {
    const ids = Array.from({ length: 18 }, (_, i) => `m${String(i).padStart(2, "0")}`);
    const sorted = [...ids].sort();
    let alternating = 0;
    for (let d = 0; d < 365; d++) {
      const key = todayKey(new Date(2026, 0, 1 + d, 12));
      const par = [1, 2, 3].map((n) => sorted.indexOf(pick(ids, `${key}:family:${n}`)) % 2);
      if (par[0] !== par[1] && par[1] !== par[2]) alternating++;
    }
    // Fair rate is 25%.
    expect(alternating / 365).toBeLessThan(0.4);
  });

  it("is still deterministic per seed", () => {
    const ids = ["a", "b", "c", "d", "e", "f"];
    expect(pick(ids, "2026-03-04:family:2")).toBe(pick([...ids].reverse(), "2026-03-04:family:2"));
  });

  it("a new day's first card avoids everything dealt yesterday (full pantry)", () => {
    let s = allTicked(freshState(new Date(2026, 0, 1, 12)));
    for (let d = 1; d < 120; d++) {
      const yesterday = dealDay(s, "family");
      s = rolloverIfNeeded(yesterday.s, new Date(2026, 0, 1 + d, 12));
      expect(yesterday.cards).not.toContain(s.today.suggestionId);
    }
  });

  it("resetShuffles deals a different sequence than the first pass", () => {
    let differs = 0;
    for (let d = 0; d < 30; d++) {
      let s = allTicked(freshState(new Date(2026, 2, 1 + d, 12)));
      const first: string[] = [];
      for (let i = 0; i < MAX_SHUFFLES; i++) {
        s = shuffle(s);
        first.push(s.today.suggestionId);
      }
      s = resetShuffles(s);
      expect(s.today.shufflesUsed).toBe(0);
      const second: string[] = [];
      for (let i = 0; i < MAX_SHUFFLES; i++) {
        s = shuffle(s);
        second.push(s.today.suggestionId);
      }
      if (first.join() !== second.join()) differs++;
      // And no card from the first pass is replayed while others remain.
      expect(second.filter((id) => first.includes(id))).toEqual([]);
    }
    expect(differs).toBe(30);
  });

  it("parses old saved state without dealt/resetCount and keeps shuffling safely", () => {
    const fresh = freshState(new Date(2026, 5, 1, 12));
    const { dealt: _d, resetCount: _r, ...oldToday } = fresh.today as typeof fresh.today & {
      resetCount?: number;
    };
    void _d;
    void _r;
    const raw = JSON.stringify({ ...fresh, today: oldToday });
    const parsed = parseState(raw, new Date(2026, 5, 1, 12));
    expect(parsed.today.suggestionId).toBe(fresh.today.suggestionId);
    expect(parsed.today.dealt?.family).toContain(fresh.today.suggestionId);
    expect(parsed.today.resetCount ?? 0).toBe(0);
    const next = shuffle(parsed);
    expect(next.today.suggestionId).not.toBe(parsed.today.suggestionId);
  });

  it("drops junk dealt/resetCount values", () => {
    const fresh = freshState(new Date(2026, 5, 1, 12));
    const raw = JSON.stringify({
      ...fresh,
      today: { ...fresh.today, dealt: { family: ["nope", 3, null], kids: "x" }, resetCount: -5 },
    });
    const parsed = parseState(raw, new Date(2026, 5, 1, 12));
    expect(parsed.today.dealt?.family).toEqual([fresh.today.suggestionId]);
    expect(parsed.today.dealt?.kids).toEqual([fresh.today.kidsSuggestionId]);
    expect(parsed.today.resetCount ?? 0).toBe(0);
  });

  it("round-trips dealt and resetCount through parseState", () => {
    let s = shuffle(allTicked(freshState(new Date(2026, 5, 1, 12))));
    s = resetShuffles(s);
    const back = parseState(JSON.stringify(s), new Date(2026, 5, 1, 12));
    expect(back.today.dealt).toEqual(s.today.dealt);
    expect(back.today.resetCount).toBe(1);
  });
});

function todayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
