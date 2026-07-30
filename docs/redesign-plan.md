# WAWET Redesign Plan — "What Are We Eating Tonight?"

Status: FINAL — consensus reached 2026-07-30 after 5 review rounds (Kimi K3 review: AGREE · Codex: AGREE · Kimi K3 security: AGREE). Round-6 non-blocking polish folded in below.
Date: 2026-07-30
Figma source: BD&C Brand file, frame `2660:8423` "What are we eating" (5 mobile screens, 375×812)

## 1. Where we are today

`projects/what-we-eating-tonight` is a Next.js 16 + React 19 + Tailwind 4 app ("Dinner Time") with:

- A 7-day week grid: one card per weekday, family meal + optional kids meal, per-day shuffle counters (max 3), warm cream/terracotta aesthetic, Fraunces display font.
- Family members with colors, per-member meal "likes", avatar stacks; `/meals` and `/family` CRUD pages.
- State in localStorage (`dinner-time-next-state-v3`) with optional Supabase sync. No `.env.local` → sync dormant. The Vercel project has ZERO env vars (verified via API 2026-07-30) → the deployed app has never synced either. The schema's RLS allows anon read/write; those tables live in the shared, PAUSED main Supabase project.
- `__tests__/dinner-planner.test.ts` re-implements production functions inline instead of importing them (verified); `playwright.config.ts` points `testDir` at `./e2e` which does not exist; CI runs `npm test` only. A `lint` script ("eslint") + `eslint.config.mjs` DO exist (verified) — CI just never calls them.
- Legacy pre-Next prototype files at root (`index.html`, `script.js`, `styles.css`) and a wrong-project PRD (`docs/prd.md` is the SEOrushed PRD).
- Repo: `github.com/Bdandc/what-we-eating-tonigh`; Vercel project `what-we-eating-tonight` is CLI-linked (`.vercel/project.json`).

## 2. What the Figma says (target design)

Five screens, minimal near-monochrome: light gray background, white cards, near-black text, one blue accent (Save), Lato, generous whitespace. One card per day. No week grid.

1. **Today** — Settings link top-right (help-circle icon + "Settings" label = ONE link, per Figma frame 126021). H1 "What are we eating tonight?". ONE suggestion card: meal name (large bold) + one-line description. Card header row: "‹ Shuffle 0/3". Below card: "Kids suggestion" pill. Footer link: "Don't have the ingredients?"
2. **Shuffled state** — new suggestion, counter "1/3".
3. **Takeaway day** — outlined/gray card variant: "Takeaway Tuesday" + "Order what you want tonight." No shuffle control. Button: "Skip Takeaway tonight".
4. **Pantry "What do you have?"** — back chevron, "Add item" top-right. Chips grouped Proteins / Veg / Sides / MISC; selected = solid white, unselected = grayed. "See more" at long lists.
5. **Add item** — bottom sheet: Name input, Category chips (Protein/Veg/Sides/MISC), full-width blue Save.

## 3. Product decisions

- **One suggestion per day.** Deterministic per date; refresh never changes it, only Shuffle does.
- **Shuffle capped at 3/day**, counter counts UP 0/3 → 3/3, then the control disables (grayed).
- **Kids suggestion** pill swaps the card between the family and kids suggestion; both draw from the SAME 3-shuffle daily budget (deliberate simplicity; revisit only if it annoys in use).
- **Takeaway day**: one configurable weekday (default Tuesday), card shows takeaway variant. "Skip Takeaway tonight" reverts to a normal suggestion for today only (free, consumes no shuffle); a small "It's takeaway day · Restore" link on the skipped state undoes it. Kids pill hidden while the takeaway card is showing; visible again after skip.
- **Pantry drives suggestions** (spec in §5). "Don't have the ingredients?" opens the pantry.
- **Cut**: family members, likes, avatars, week grid, kids-toggle-per-day, `/meals`, `/family`, warm-cream design, Fraunces. Custom MEAL CRUD deferred. `takeaway-night` REMOVED from the family meal pool (takeaway is a day-mode, not a meal).
- **Settings** (minimal, no design provided): takeaway day picker (incl. "none"), kids suggestions on/off (hides the pill; turning it OFF forces `view: "family"`), reset today's shuffles (sets `shufflesUsed = 0` only — current suggestion ids persist, consistent with stored-ids-as-truth; acknowledged quirk: the post-reset shuffle sequence repeats seeds from `:1`, so earlier-shown meals can recur same-day — accepted, deterministic by design). Nothing more.
- **No external links anywhere in v1.** The Settings control is an internal route. Any future external link requires `rel="noopener noreferrer"` and an explicit origin allowlist.
- **Local-only persistence, Supabase REMOVED.** Delete `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `supabase/schema.sql`, and the `@supabase/*` deps (blast radius verified by grep: those 2 files + `dinner-planner.tsx`, which Phase 3 deletes anyway; no middleware/proxy file exists). Removal is SURGICAL: `npm uninstall @supabase/ssr @supabase/supabase-js`, then verify via `git diff package-lock.json` that only Supabase subtrees changed (no full-tree re-resolution / supply-chain drift). Any future sync is a new feature gated on an auth + RLS redesign; never revive the current schema; never point this app at the paused main project.
- **Residual risk (accepted + tracked)**: the 4 public-write tables still exist inside the paused shared Supabase project `aydatebrievbmmaxegsp`. Unreachable while paused; dropping them requires restoring a SHARED project — out of scope here. Trigger-conditioned follow-up, to be added to the repo `CLAUDE.md` Gotchas in Phase 3: "if `aydatebrievbmmaxegsp` is ever restored, drop `favorite_meals`, `day_settings`, `family_members`, `meal_member_preferences` BEFORE it accepts traffic." Anon key/ref never committed (git-history grep verified).

## 4. State spec (`src/lib/wawet-state.ts`)

Single versioned envelope persisted under localStorage key `wawet-state-v1`:

```ts
type WawetState = {
  version: 1;
  today: {
    date: string;            // "YYYY-MM-DD", LOCAL time, manually zero-padded (no Intl locale tricks)
    suggestionId: string;    // family meal id
    kidsSuggestionId: string;
    shufflesUsed: number;    // 0..3, shared family+kids budget
    view: "family" | "kids"; // which suggestion the card shows
    takeawaySkipped: boolean;
  };
  pantry: Record<string, boolean>;   // ingredientId -> have?
  customIngredients: { id: string; name: string; category: Category }[];
  settings: { takeawayDay: Weekday | null; kidsEnabled: boolean };
};
```

**Fresh defaults (pinned)**: `settings.takeawayDay = "Tuesday"`, `settings.kidsEnabled = true`, `view = "family"`, `shufflesUsed = 0`, `takeawaySkipped = false`, pantry = all seeded ingredients "have", no custom ingredients. These are the values `parseState` falls back to and the values a first-run user sees.

**Pool disjointness (pinned)**: family and kids meal pools are DISJOINT BY CONSTRUCTION — separate id sets in `wawet-data.ts`, asserted by a unit test — so `suggestionId` and `kidsSuggestionId` can never be the same meal. Custom ingredients are capped at 200 (reject with inline error past the cap; the wrapped `setItem` already absorbs the quota worst case).

- **Stored ids are the source of truth.** `suggestionId`/`kidsSuggestionId` are computed once and persisted; nothing recomputes them on render. Recomputation happens ONLY on: date rollover, shuffle, pantry-invalidation re-pick, parseState repair of a dangling id.
- **Deterministic pick**: `pick(pool, seedString)` = FNV-1a hash of `seedString` mod `pool.length` over the pool sorted by id. Daily picks are SYMMETRIC: family = `pick(eligibleFamilyPool, date + ":family:0")`, kids = `pick(eligibleKidsPool, date + ":kids:0")` — each view's eligible pool, with that view's §5 fallback when its eligible pool is empty. Shuffle: increments the shared `shufflesUsed` to n and re-picks ONLY the currently viewed suggestion with seed `date + ":" + view + ":" + n`, pool minus the current id (no immediate repeat). The other view's suggestion is untouched. A pantry-invalidation re-pick reuses the CURRENT `shufflesUsed` as its salt with the new pool (free; budget untouched). Pool of size ≤ 1 → keep current; shuffle control disabled. `Math.random` never used in suggestion logic.
- **Load path**: `parseState(raw: string | null): WawetState` — full validation: reject wrong `version`; clamp `shufflesUsed` to [0,3]; verify suggestion ids exist in pools (else re-pick); enforce `view: "family"` whenever `settings.kidsEnabled` is false; drop custom ingredients with invalid category, empty name, or name > 60 chars; any failure → fresh defaults. Pantry rebuilt ALLOWLIST-first: iterate known ids (catalogue + validated custom ids), read values off the parsed object — never spread/Object.assign parsed keys; internal map uses `Object.create(null)`. Fuzz tests include `__proto__`/`constructor` keys, garbage JSON, wrong types.
- **Storage access — ALL of it wrapped**: `getItem`, `setItem`, AND `removeItem` each run inside try/catch (any can throw `SecurityError` in hardened/private modes; quota errors on write) → fall back to in-memory defaults, app keeps working. The current code's unwrapped `getItem` (`dinner-state.ts:167`-era pattern) is explicitly NOT carried forward. Tests simulate each operation throwing. On first successful load, `localStorage.removeItem("dinner-time-next-state-v3")` clears the old key (PII residue).
- **Date & rollover**: date computed CLIENT-side only. Root screen renders a skeleton until mounted (no SSR localStorage read, no hydration mismatch). If stored `today.date` ≠ current local date → roll: new deterministic suggestions, `shufflesUsed = 0`, `takeawaySkipped = false`, `view` preserved (unless kids disabled → family). Rollover checked on mount, `visibilitychange`, and a 60s interval.
- **Settings normalization**: changing `takeawayDay` so today is no longer a takeaway day resets `takeawaySkipped = false`. `kidsEnabled = false` forces `view = "family"` (action AND parseState).
- **Custom ingredient input rules** (state module, not component): trim; reject empty; cap 60 chars; strip control characters. **Id is OPAQUE and generated** (`"c-" + crypto.randomUUID()`), never derived from the name — slug collisions ("Fish & Chips" vs "Fish Chips"), truncation collisions, and empty-slug non-Latin names are impossible by construction; non-Latin names are fully supported (name is display-only). Name uniqueness (GLOBAL, case-insensitive, across all categories AND the seeded catalogue) is enforced as a UX rule → inline error. `parseState` validates persisted ids against the FULL format `^c-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$` (not just the prefix), drops entries with malformed or duplicate ids, and prunes their pantry keys. `crypto.randomUUID` availability verified (Node 25 local, Node 20 CI, vitest keeps Node globals under jsdom); `generateId()` lives in the state module so tests can also stub it where determinism matters. Tests: name-collision rejection, non-Latin names accepted, tampered/duplicate persisted ids dropped. Chips render names as TEXT NODES only — no `dangerouslySetInnerHTML`, no attribute/URL interpolation, ever.

## 5. Pantry + suggestion semantics

- **Ingredient catalogue**: seeded list matching the Figma chips, deduped — each ingredient has ONE id and ONE category ("Cheese sticks" lives in Sides only). MISC = freezer/cupboard convenience items.
- **Meal → ingredient mapping is OPTIONAL and sparse.** A meal lists only ingredients it genuinely depends on. A meal with no mapping is ALWAYS eligible.
- **Filter rule**: meal is eligible unless one of its mapped ingredients is explicitly "don't have". Default pantry = everything "have" → filter is a no-op until the user engages.
- **Custom ingredients** are trackable pantry items only in v1 — they cannot gate seeded meals. Documented in-app ("for your shopping memory").
- **Invalidation is SYMMETRIC across views**: any pantry change re-evaluates BOTH stored suggestions (family and kids) immediately; whichever became ineligible gets a deterministic free re-pick (§4 salt rule, its own view namespace). `parseState` applies the same repair to dangling OR ineligible stored ids on load.
- **Empty-pool fallback (pinned, per view)**: eligible pools are computed independently per view. If a view's eligible pool is EMPTY, that view enters fallback mode: suggestion = `pick(fullPoolOfThatView, date + ":" + view + ":" + shufflesUsed)`, notice line shown ("Nothing matches your pantry — showing everything"). The kids pill stays visible and functional regardless of fallback state. Shuffle remains LIVE in fallback mode against that view's FULL pool minus current, same seed formula, still consuming the shared budget. Leaving fallback (pantry regains matches) re-evaluates exactly like any other pantry change. Never a dead end, in either view.
- **"See more"**: each category shows up to 8 chips, remainder collapsed behind "See more" (expand in place, per-category).

## 6. Screens & components

- `/` **Today** (client component): skeleton until mounted. Header: single Settings link (help-circle icon + "Settings" label, internal route). H1. Card variants: `normal` (name, description, "‹ Shuffle x/3" — one tap target; disabled + grayed at 3/3 or pool ≤ 1), `takeaway` (outlined style, day-named title, "Order what you want tonight.", Skip button, no shuffle), `skipped` (normal card + "It's takeaway day · Restore" link). "Kids suggestion" pill (hidden when takeaway card showing or `kidsEnabled` false; label flips to "Family suggestion" when viewing kids). Footer link "Don't have the ingredients?" → `/pantry`.
- `/pantry`: back chevron, "Add item" opens the bottom sheet. Category groups with toggle chips. Bottom sheet: `<dialog>`-based (native focus trap + Esc), scrim click closes, `aria-modal`, name input autofocused, inline validation errors, Save disabled until valid.
- `/settings`: back chevron (same pattern as `/pantry`), takeaway day picker (incl. none), kids toggle, reset-today's-shuffles. Same visual language.
- **Design tokens** in `globals.css`: `--background #F2F2F2`-range gray, white surface, near-black text `#111`, blue accent, muted gray disabled, radius 12px cards / full pills. Font: Lato via `next/font/google` (400/700; self-hosted at build — needs network at CI build time, which GitHub Actions has). Remove Fraunces/Plus Jakarta + gradients. Mobile-first 375px; centered column on desktop.

## 7. Phases

1. **Phase 1 — State core.** `wawet-state.ts` + `wawet-data.ts` (meals with existing descriptions, ingredient catalogue, sparse mappings). Unit tests IMPORT the production module: deterministic pick, per-view shuffle sequence + shared cap + stability under pool change, rollover, kids-disabled forcing, settings normalization, reset-shuffles semantics, pantry filter + pinned per-view fallback + allowlist rebuild, parseState fuzz (incl. malformed/duplicate custom ids), custom-ingredient name-uniqueness validation, storage ops throwing. `npm run lint` runs in this phase too (already verified green today — exit 0, 4 warnings, all in files Phase 3 deletes — so any new failure is OUR code). Old modules untouched; CI stays green.
2. **Phase 2 — Screens + CSP.** `/`, `/pantry`, `/settings` on the new state; new tokens + Lato; routes stop importing old components. App identity updated: `layout.tsx` metadata (title "What Are We Eating Tonight?", description) replaces the old "Dinner Time" branding alongside the font swap. CSP spike checklist (explicit, before committing the pattern): correct file convention for our pinned Next version (`proxy.ts` vs `middleware.ts` naming), nonce present on served HTML for ALL THREE routes, per-route dynamic rendering PROVEN (`export const dynamic = "force-dynamic"` on each route or verified via build output — the "two responses, two nonces" test fails silently on statically-optimized routes, so static optimization must be demonstrably off). CSP ships HERE (not Phase 3) so no redesigned deploy ever goes out unprotected: per-request-nonce CSP via the Next proxy/middleware nonce pattern (official Next.js CSP guide, verified current for our App Router version; requires dynamic rendering — accepted for 3 tiny client-driven pages): `default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; upgrade-insecure-requests`, plus `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`. `style-src 'unsafe-inline'` is a DELIBERATE, documented exception (React inline styles + Tailwind reality) — do not "fix" script-src down to match. There is NO silent fallback: if the nonce pattern misbehaves on our pinned Next version during the build spike, STOP and surface the decision to Andrew — a downgraded CSP must never ship under the Phase 4 gate (which asserts no `unsafe-inline` in script-src), and weakening that gate is a decision, not a default.
3. **Phase 3 — Cleanup.** Delete `dinner-planner.tsx`, `dinner-state.ts`, `/meals`, `/family`, `__tests__/dinner-planner.test.ts` (duplicates deleted logic; verified it imports nothing from src/, so ordering is safe), `src/lib/supabase/*`, `supabase/`, surgical `npm uninstall` of `@supabase/*` + lockfile diff check, legacy root `index.html`/`script.js`/`styles.css`; replace `docs/prd.md` (SEOrushed) with a short WAWET product note; add the residual-risk gotcha line to repo `CLAUDE.md` (§3).
4. **Phase 4 — Tests, CI, deploy.** Create `e2e/` (config already targets it; dir does not exist yet): today-card render; shuffle ×3 then cap; kids pill swap + kids-disabled forcing; takeaway day (clock-mocked) + skip + restore; pantry toggle re-picks; fallback-mode notice + live shuffle; add custom item (incl. duplicate rejection) + persists; settings changes apply; CSP assertions — two sequential responses carry DIFFERENT nonces, header nonce matches inline script nonces in served HTML, `script-src` contains no `unsafe-inline`, `object-src 'none'` present. CI updated: `npm run lint` (verified working today) + `npm run build` + unit + `npx playwright install chromium --with-deps` (browser binaries are NOT installed by `npm ci` — required per Playwright's official CI guidance) + e2e (no separate server-start step needed — `playwright.config.ts` already has a `webServer` block running `npm run dev`, verified) + `npm audit --audit-level=high` as a SEPARATE non-required job (visibility without deadlock: unfixable transitive advisories must not brick CI; promoting it to a hard gate is a later explicit call, with an allowlist-with-expiry process defined at that point). **Deploy mechanism (explicit)**: `npx vercel --prod` from the project folder against the existing CLI-linked project; re-verify env vars are still zero at deploy. Then `/qa` + a real browser walkthrough on the production URL.

## 8. Review changelog

### Round 1 (Kimi K3 review BLOCKERS ×7, Codex BLOCKERS ×6, Kimi security AGREE+5)
Accepted: shuffle control spec; suggestion invalidation + deterministic shuffle; takeaway interactions; client-mount gate + rollover; catalogue dedupe + sparse mappings; pantry default all-have; versioned envelope + parseState + storage-failure handling; custom-ingredient semantics documented; `takeaway-night` removed; tests import production code; e2e + CI hardening; Supabase fully removed; old-key PII cleanup; text-only chips; security headers.
Rejected: "meal libraries lack descriptions" — false (`dinner-state.ts:78-103`).

### Round 2 (Kimi K3 review BLOCKERS ×5, Kimi K3 security BLOCKERS ×4)
Accepted: old test file deleted in Phase 3 (rationale corrected — duplicates, doesn't import); kids-disabled forces family view; help icon = part of single Settings link; shuffle salt semantics pinned; repo claims verified (e2e dir, supabase grep); manual date padding; takeawayDay normalization; full nonce CSP; allowlist pantry rebuild + `__proto__` fuzz; Vercel env audit executed (zero vars).
Amended: remote-table deletion → residual risk + trigger-conditioned follow-up (tables live in PAUSED shared project).

### Round 3 (Kimi K3 review BLOCKERS ×5, Kimi K3 security AGREE+4; Codex seat: v1→v3 delta reviewed separately)
Accepted: custom-ingredient uniqueness made GLOBAL (fixes cross-category slug/id collision); empty-pool fallback pinned (exact pick seed + live shuffle vs full pool); lint claim VERIFIED (script + config exist; CI will call them); nonce CSP VERIFIED against official Next.js CSP guide (proxy/middleware nonce pattern; headers-only fallback documented); deploy mechanism stated explicitly (`npx vercel --prod`, CLI-linked project). Security polish folded in: surgical uninstall + lockfile diff, `npm audit` in CI, CSP moved to Phase 2, nonce-correctness e2e assertions, `object-src 'none'` + `upgrade-insecure-requests`, CLAUDE.md gotcha line, reset-shuffles semantics pinned.
Noted, not actioned: Phase 2 leaves `/meals`/`/family` URL-reachable until Phase 3 (harmless, no deploy happens between phases; deploy only in Phase 4).

### Round 4 (Kimi K3 review: kids-fallback spec hole [output truncated mid-list — treated as its full submission for this round]; Codex BLOCKERS ×4; security seat AGREE standing since v3)
Accepted: fallback mode + invalidation made SYMMETRIC per view (kids pool gets identical empty-pool fallback, pill stays functional, parseState repairs dangling/ineligible ids in both views); custom-ingredient ids made OPAQUE generated (`c-` + UUID) with name-only uniqueness — kills slug/truncation/non-Latin collisions, parseState drops tampered/duplicate ids; ALL localStorage operations (get/set/remove) wrapped with throw-simulation tests; `npx playwright install chromium --with-deps` added to CI before e2e; CSP fallback REMOVED — nonce-spike failure now stops and escalates rather than silently downgrading below the Phase 4 gate.

### Round 5 (Kimi K3 review BLOCKERS ×7, Codex BLOCKERS ×2)
Accepted (Codex): daily kids pick corrected to `eligibleKidsPool` with per-view fallback (§4/§5 now consistent); custom-id validation upgraded to full `c-<UUID>` regex so the tamper-detection claim matches parser capability.
Accepted (Kimi): lint executed TODAY — green (exit 0; 4 warnings, all in Phase-3-deleted files) and added to Phase 1; `crypto.randomUUID` verified present (Node 25 local / Node 20 CI) + stubbable `generateId()`; metadata/title rebrand added to Phase 2; `npm audit` demoted to a separate non-required CI job with a defined promotion path (no deadlock, no silent gate-weakening); `kidsEnabled`/`takeawayDay` defaults pinned in §4; CSP spike checklist expanded (proxy-vs-middleware file naming, per-route dynamic rendering proven, nonce on all three routes); reset-shuffles seed-repeat quirk acknowledged in §3.
Refuted with evidence (Kimi #1): Playwright `webServer` block EXISTS in `playwright.config.ts` (`npm run dev` @ :3000, `reuseExistingServer` — read directly from the file); no separate CI server-start step is needed. Grounding updated.

### Round 6 — FINAL (Kimi K3: AGREE +4 non-blocking · Codex: AGREE · security seat: AGREE standing since v3)
Non-blocking polish folded in: pool disjointness pinned + unit-asserted; `/settings` back chevron; custom-ingredient count cap (200); note — if e2e ever fails on `upgrade-insecure-requests` against the localhost dev server, diagnose the loopback exemption, do NOT strip the directive. Seat notes: the final Kimi K3 pass required a one-off call with a 25k completion budget (the consensus script's 4000-token cap starved reasoning models into empty responses on the grown doc — also explains the round-3 timeout and a truncated round-4 reply; every substantive round DID complete with a full verdict). No seat was skipped: all three seats returned AGREE on the final text.
