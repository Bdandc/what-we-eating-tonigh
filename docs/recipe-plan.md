# WAWET: recipe link on the suggestion card (final plan, consensus v4)

Hardened through /consensus 2026-08-01: 3 rounds, seats = DeepSeek V4 Pro + GLM 5.2 +
Kimi K3 (open) + DeepSeek V4 Pro (security). Security seat: AGREE. All round-3 objections
accepted and folded in below. Full changelog at the end.

Goal: tapping tonight's card opens the cooking instructions for that dish. All 63 built-in
dishes in Phase 1; the user's own meals in Phase 2. Local-only, no backend, no network.

## Approach: built-in static recipes
Rejected: external search links (generic results, kids dish names search badly, leaves the
app, needs network); AI-generated (needs a server + API key the app does not have; revisit
after the accounts/backend phase, if ever).

## Phase 1: built-in recipes + recipe page + card link

### Data
- `src/lib/wawet-recipes.ts`: `type Recipe = { serves: number; time: string; steps: string[] }`,
  `recipes: Record<string, Recipe>` keyed by seeded meal id.
- Lookup discipline: ALL reads via `seededRecipeFor(id)` using `Object.hasOwn` (the PR #13
  seededMealFor pattern). `Object.hasOwn` is the ONLY prototype defense; id-shape checks are
  input hygiene on top ("toString" passes the seeded grammar by design and is stopped by hasOwn).
- Seeded-vs-custom discriminator: `Object.hasOwn(recipes, id)` → seeded; else
  `resolveMeal(state, id)` finds a custom meal → custom branch; else not-found.
- Verified 2026-08-01: 63 seeded ids unique, all matching `/^[a-z0-9-]+$/` (0 violations);
  duplicate meal ids already fail CI (check-catalogue.ts:45). Custom ids are
  `m-${crypto.randomUUID()}` (wawet-state.ts:650); `CUSTOM_MEAL_ID_RE` (wawet-state.ts:75)
  becomes an EXPORT of wawet-state.ts and the recipe module IMPORTS it. No new grammar.
- `validateRecipes(meals, recipes)` lives in and is exported from `src/lib/wawet-recipes.ts`,
  consumed by BOTH `scripts/check-catalogue.ts` (CI; already imports ../src/lib under tsx) and
  a vitest spec. It asserts: SET EQUALITY between recipe keys and seeded meal ids (catches
  silent duplicate-key overwrites in the object literal, not just coverage), steps.length >= 1,
  serves >= 1, and no em dashes in any step/time string (CLAUDE.md copy rule, enforced).
- Recipes file + check-catalogue extension + recipe page land in the SAME commit.
- Content: UK English, metric, serves 4, 6-8 short imperative steps, tone of the existing
  descriptions, quantities only where essential (hero-ingredient pantry model). Claude drafts
  all 63; Andrew reviews the text in the PR.
- Bundle: imported only by the recipe route ([ASSUMPTION] ~40-100KB source; checked at build).

### Recipe page: one contract, zero renderer branches
- Route: `src/app/recipe/[id]/page.tsx` is a THIN SERVER wrapper that reads the `params.id`
  and `searchParams.from` and passes both as props to the client `recipe-screen.tsx`.
  No useSearchParams in the client component, so no Suspense-boundary build hazard
  (round-3 fix; /meals/[id] precedent covers params + localStorage only, not search params).
- View-model (simplified in round 3: custom instructions render as NUMBERED STEPS too, which
  matches the step-per-line way people type them; the ol-vs-p split and the renderAs
  discriminator are GONE, resolving rounds 2 and 3 together):
  `type RecipeView = { name; kind; serves?; time?;
    ingredients: { name: string; inPantry: boolean }[]; steps: string[] }`
  - Seeded → steps = recipe.steps.
  - Custom (Phase 2) → steps = sanitized instructions split on `/\n+/` (every newline is a
    step; empty/whitespace-only → []).
  - steps.length > 0 → numbered <ol>. steps.length === 0 (custom, Phase 1, or blank field) →
    the line "Your own meal. You know how you like it." with an "Edit meal" link to
    /meals/<id> (the edit form; copy promises nothing that ships later, round-3 fix).
  - One renderer, one steps array, no branching on source.
- `inPantry` per ingredient = `state.pantry[ingredientId] === true`, the exact-id check the
  meal form already uses. No name matching.
- Unknown/invalid id → the /meals/[id] "That meal no longer exists." fallback. Shape hygiene
  first: `/^[a-z0-9-]+$/` or imported CUSTOM_MEAL_ID_RE. Hidden built-ins still resolve.

### Back navigation: allowlist, no history heuristics
- Today links to `/recipe/<id>`; My Meals links to `/recipe/<id>?from=meals`. The server page
  maps `from` through a fixed table `{ meals: "/meals" }`; anything else → `/`. Back is a
  plain <Link> to that fixed href. No user or id data ever enters a navigation target;
  direct-URL entry gets a working Back to Today by default.

### Card link
- "How to cook it" on the dealt card face → `/recipe/<currentId>`,
  `currentId = view === "family" ? today.suggestionId : today.kidsSuggestionId`
  (today-screen.tsx:136; both views share this card path). Verified: both ids always exist
  (freshState and rolloverIfNeeded populate them unconditionally; parseState repairs dangling
  ids on load).
- Swipe safety by construction: the deck's onClickCapture swallows any click inside the swipe
  surface after a drag past TAP_SLOP; suppressClick sets on pointerup, clears on next
  pointerdown or after 300ms (use-swipe-shuffle.ts:140-144, :171; verified). Existing card
  links already rely on this.

### My Meals rows
- BUILT-IN rows: dish name becomes a <Link> to `/recipe/<id>?from=meals`; the Hide/Show
  button stays its SIBLING in the flex row. No nested interactive elements.
- CUSTOM rows: UNCHANGED. They keep the whole-row Link to /meals/[id] (edit form, two-tap
  delete). No affordance lost; recipe access for custom dishes is via the card.
- Existing e2e that clicks My Meals rows (custom-meals.spec.ts, 12 click actions) gets audited
  in the PR; custom-row specs should pass untouched, built-in-row assumptions get updated.

### Tests (Phase 1)
- Unit: validateRecipes spec (shared with CI, incl. key-set equality); seededRecipeFor
  prototype keys ("toString", "constructor" → undefined); RecipeView adapter for seeded /
  custom-empty (steps [] + fallback copy) / unknown; from-param mapping incl. junk → "/".
- e2e: (1) Today → link → steps render → Back → Today; (2) swipe-then-release over the link
  does NOT navigate (drag decisively past the 60px/2:1 threshold to avoid flake);
  (3) My Meals built-in row → recipe → Back → /meals; (4) direct URL entry → Back → "/";
  (5) Hide toggle still works on linked rows. Seeded localStorage state for determinism.
- Baseline verified by RUNNING (not listing), 2026-08-01 @ main 8b7ad25: 112 unit green;
  e2e 33 passed + 12 by-design cross-project skips, 0 failures.

## Phase 2: instructions for the user's own meals
- `CustomMeal.instructions: string`, canonical "" (not optional; mirrors `description`).
  parseState: missing/invalid on pre-upgrade states → "".
- `sanitizeInstructions(raw)` (existing stripControl strips \n so it CANNOT be reused;
  single-line fields keep it untouched):
  1. normalize `\r\n`, `\r`, U+2028, U+2029 → `\n` (Zl/Zp are line terminators outside \p{C});
  2. strip remaining control/invisible chars: `/(?!\n)[\p{C}]/gu` (bidi overrides, zero-width;
     regex verified under tsx; no browserslist override in package.json so Next 16 modern
     defaults apply, all ES2018+; CI e2e exercises the path in real Chromium);
  3. collapse 3+ newlines to 2; trim; cap MAX_INSTRUCTIONS_LENGTH = 2000.
- Meal form: optional "How to cook it" textarea, hint "One step per line."; saved via
  add/updateCustomMeal; rendered through the same numbered-steps renderer as React text nodes
  (the app has no dangerouslySetInnerHTML).
- Unit tests: sanitizer (CRLF, U+2028/U+2029, bidi/zero-width, newline preservation, collapse,
  cap), parseState junk/missing/oversize, round-trip, adapter edges (empty → [], single \n
  splits, whitespace-only → []).

## Security summary (seat verdict: AGREE, round 3)
1. Prototype-key access → Object.hasOwn-only lookups (sole defense; grammar checks are hygiene).
2. Unicode spoofing in instructions → \p{C}-strip except \n PLUS Zl/Zp normalization; React
   text nodes only.
3. Navigation → Back hrefs from a fixed allowlist table; recipe hrefs interpolate only
   state-validated ids (CUSTOM_MEAL_ID_RE enforced in parseState) under the fixed /recipe/ prefix.
No network, no new origins, CSP untouched.

## Delivery
Two PRs on `Bdandc/what-we-eating-tonigh` (Phase 1; Phase 2): codex diff review, /qa incl.
live prod smoke, squash merge, Vercel auto-deploy. Phase 1 ~1 day (mostly content);
Phase 2 ~2-3 hours. /security-review runs on each diff.

## Out of scope
Photos; exact-quantity shopping lists; AI/fetched recipes; any backend; changing sanitization
of existing single-line fields; custom-row layout changes. The parked accounts/household plan
is unaffected (static content + one field inside the synced state blob).

## Consensus changelog
- R1 (all seats BLOCKERS): stripControl/newline contradiction (accepted: dedicated sanitizer);
  Object.hasOwn lookups + discriminator (accepted); false "link-plus-button pattern" claim
  (retracted; sibling-elements redesign); back-nav UX (accepted); dangling Phase 1 copy
  (accepted); stale test counts (corrected); id uniqueness + /meals/[id] editability +
  custom-meals-in-pools (verified). Security R1: hasOwn, \p{C} sanitizer, fixed back targets
  (all accepted).
- R2 (all seats BLOCKERS): renderAs discriminator demanded (superseded in R3 by unifying on
  numbered steps); history-heuristic back nav rejected → from-param allowlist; suggestion-ids
  always-populated (verified); id grammars (verified, 0 violations; reuse CUSTOM_MEAL_ID_RE);
  custom rows unspecified (fixed: unchanged); inPantry derivation (cited); single-\n UX
  (fixed: split on every newline); empty-instructions blank <p> (fixed: steps []);
  instructions?: vs "" (fixed: canonical ""); U+2028/U+2029 (accepted into sanitizer);
  300ms suppression claim (verified with citation, rebuttal upheld).
- R3 (GLM + Kimi BLOCKERS, all accepted): searchParams via server-page props, no Suspense
  hazard; validateRecipes key-set equality; CUSTOM_MEAL_ID_RE import direction corrected;
  prose-vs-steps intent reconciled (numbered steps for both, discriminator removed);
  browserslist verified (no override); e2e baseline RUN (33 pass/12 by-design skips/0 fail);
  Phase 1 fallback copy de-forward-referenced; validateRecipes home stated.
- Dissent log: DeepSeek timed out in R3 (its R1/R2 findings were all resolved; timeout is
  recorded, not counted as agreement). Security seat: AGREE (R3). No objection anywhere was
  rejected without a code citation; none recurred after its fix.
