# WAWET v2 — Green reskin + swipe-to-shuffle

Status: DRAFT v4 (round-3: Codex AGREE; Kimi's final scoping blocker folded in)
Date: 2026-07-30
Figma: frame `2660:8423` updated in place (5 screens restyled; colors pixel-sampled). Baseline: shipped main (62 unit + 15 e2e green, live).

## 1. Design deltas (verified)

- Palette: light green `#CBF2B9` (Today bg, selected category chip fill), deep green `#022C19` (takeaway page bg, primary buttons), cream `#F5F5EF` (pantry/sheet/settings bg), white cards/chips, black text on light / white on dark. Blue is gone.
- Takeaway = whole-page dark state with a plain WHITE card and a white Skip button.
- Icons: gear (Settings), swap-arrows (Shuffle), plus-square (Add item). Footer link underlined.
- **Decisions previously left open, now made:**
  - **Kids pill = outlined** (transparent, 1px `#022C19` border, black text) — the Figma screen-2 white variant is treated as an inconsistent leftover; outlined matches screen 1 and reads correctly on green. Single static treatment, documented here.
  - **Skipped-takeaway state = LIGHT page** (it shows a normal suggestion): light green bg, normal card, "It's takeaway day · Restore" link in explicit `#022C19` underlined (not the muted gray — fixes the hard-coded `text-muted` at today-screen.tsx:172).
  - **Settings is OUT of the Figma visual gate** (no frame exists); it is restyled to the cream + `#022C19` language and QA'd for coherence only.
  - `--muted` darkens `#8a8a8a` → `#666666` (≥4.5:1 on white AND cream for small text; existing failure flagged by review, fixed globally).
  - `--foreground` stays pure black `#000` (matches sampled design).

## 2. Swipe-to-shuffle (fully specified)

**Gesture module `src/lib/swipe.ts` — pure, unit-tested:**
`evaluateSwipe(dx, dy): "shuffle" | "none"` → shuffle iff `|dx| >= 60` (RAW pointer dx, not visual) AND `|dx| > 2 * |dy|`. Direction-agnostic. Also exports `dragOffset(dx)` = resistance curve `sign(dx) * min(|dx|, 90) * 0.85` for the visual only.

**Hook `useSwipeShuffle` on the normal card only** (takeaway card gets NO handlers — no dead gesture):
- `pointerdown`: ignore unless `isPrimary && (button === 0 || pointerType !== "mouse")`; ignore if `event.target.closest("button, a, input, [role=button]")` (child taps never start a gesture); record `pointerId` + origin in REFS (never retain synthetic events); `setPointerCapture(pointerId)`.
- `pointermove`: only for the active `pointerId`; write `transform: translateX(dragOffset(dx))` DIRECTLY to the card element via ref, rAF-throttled — zero React re-renders during drag. Skipped entirely under `matchMedia("(prefers-reduced-motion: reduce)")` (no transform, not just no transition).
- `pointerup`: if `evaluateSwipe(dx,dy) === "shuffle"` and `canShuffle(state)` → **shuffle immediately on release** (state swaps at once; the card transform resets and the new meal animates in with a short motion-safe fade/slide). NO render-after-spring-back, no `transitionend` dependency — one code path, reduced-motion and `page.clock` safe.
- Cleanup resets transform + refs on `pointerup`, `pointercancel`, AND `lostpointercapture`; `hasPointerCapture()` checked before release.
- Post-drag click suppression: if the gesture exceeded 10px, set a ref flag; a capture-phase `onClickCapture` on the card swallows the trailing click when the flag is set. The flag is CLEARED on the next `pointerdown` AND by a 300ms timeout — never rely on the click being retargeted to the card (on release-outside, capture is already released and the click hit-tests elsewhere, so consumption alone would leave the flag stale and eat the next legitimate tap). Sub-10px movement = tap; child elements behave normally.
- During an active drag: `user-select: none` + `-webkit-user-select: none` on the card; `touch-action: pan-y` statically so vertical scroll always belongs to the browser.
- At 3/3 or pool ≤ 1: handlers attach but `pointermove` applies NO transform and release does nothing (no resisted-drag training of a dead gesture; the counter already communicates state).

## 3. Implementation

1. **Tokens** (`globals.css`): `--background #F5F5EF`, `--surface #fff`, `--foreground #000`, `--muted #666`, `--green-light #CBF2B9`, `--green-deep #022C19`, `--accent` → `#022C19`. Accent consumers audited: input focus border (pantry/settings sheets — cream context, fine) and Save/primary buttons; nothing on the dark page consumes `--accent` (shuffle control is black-on-white-card; footer link is explicitly white there).
2. **Today page structure**: `TodayScreen` renders a FULL-WIDTH wrapper `div` (`min-h-dvh w-full`) carrying the light/dark background, with the `max-w-md` column inside (fixes the desktop-gutter hole at the current `main.max-w-md`). Additionally a `useEffect` toggles `document.body.classList` `wawet-dark`/`wawet-light` (defined in globals.css) so iOS overscroll/rubber-band shows the right color; its cleanup REMOVES BOTH classes on unmount, so client-side navigation to Pantry/Settings returns to the cream body default. Skeleton phase (state null) renders on CREAM with no transition; the first post-hydration paint may switch to green/dark in one un-animated step — accepted, documented (state is client-only by design).
3. **Today content**: gear icon; ⇆ glyph; outlined kids pill; underlined footer link (white on dark, `#022C19` on light); takeaway card = plain white (keep `data-variant="takeaway"`); Skip = white button, dark text; Restore link per §1. Header "Settings" white on dark.
4. **Pantry/sheets**: cream from body default; plus-square icon; selected category chips = `#CBF2B9` fill + 1px `#022C19` border; Save buttons = `#022C19` white text. Settings: same accents; selected day chip + toggle track → `#022C19`.
5. **No state-module changes** (`wawet-state.ts`, `wawet-data.ts` untouched). CSP untouched — the drag transform is written directly to the element's `style` via ref/rAF per §2 (NOT a per-move React re-render); element-style mutation falls under the documented `style-src 'unsafe-inline'` exception (verified against `src/proxy.ts`).
6. **Two commits minimum**: (a) reskin, (b) gesture — so visual QA diffs stay clean.

## 4. Tests & verification

- **Unit adds**: `swipe.ts` — threshold boundary (59/60/61), axis dominance (dx=80,dy=41 vs 39), direction symmetry, resistance curve cap. Existing 62 stay green (no state change).
- **e2e adds** (new spec, both existing chromium project AND a new `mobile-chromium` project — Pixel-class viewport, `hasTouch: true`, `isMobile: true`. VERIFIED: Playwright 1.59's high-level `Touchscreen` API is tap-only, so the touch-path drag uses a CDP session with `Input.dispatchTouchEvent` (touchStart/touchMove/touchEnd sequences — Chromium-only, zero new deps); mouse-drag in a touch viewport is NOT accepted as touch coverage. PROJECT↔SPEC SCOPING (explicit): the `mobile-chromium` project sets `testMatch: '**/swipe.spec.ts'` so the existing 15 desktop-verified specs NEVER run under it; inside `swipe.spec.ts`, mouse-drag tests `test.skip()` when `testInfo.project.name === 'mobile-chromium'` and the CDP touch tests `test.skip()` unless it IS `mobile-chromium` — every test runs in exactly one appropriate project and CI stays green):
  (a) drag 100px left on the card → meal changes + counter 1/3 (precondition asserted in-test: default full family pool has >1 eligible meal);
  (b) drag at 3/3 → no change;
  (c) 30px drag → no shuffle, no click side effects;
  (d) child-exclusion: drag starting on the NESTED shuffle button (inside the card — the kids pill is a card SIBLING and never hits the card handlers) → no swipe-shuffle occurs from the drag; separately, a plain tap on that button → exactly one shuffle. No click-count expectation on drags (a drag from a button is not guaranteed to synthesize a click);
  (e) takeaway card (clock-mocked Tuesday) → drag does nothing;
  (f) vertical drag (dy-dominant) → no shuffle;
  (g) release outside the card bounds → still evaluated (capture held).
- **Residual risk, documented**: real iOS Safari scroll arbitration is not covered by emulation (no WebKit/touch device in CI); `touch-action: pan-y` + capture cleanup is the standard mitigation. Verify once manually on a phone post-deploy; do NOT block the merge on it.
- Existing 15 e2e must stay green (selectors are testid/aria-based; new SVGs stay `aria-hidden`).
- **Ship**: branch → lint/build/unit/e2e → /qa visual vs Figma (Settings excluded per §1) → PR → CI green → merge → prod walkthrough incl. a real drag on the live site.

## 5. Round-1 changelog

Accepted (Kimi 1-8, Codex 1-7, deduped): shuffle-on-release replaces render-after-spring-back; full pointer lifecycle (primary-only, single pointerId, up/cancel/lostpointercapture cleanup, refs, hasPointerCapture); raw-dx threshold + rAF direct-DOM transform (no per-move re-renders); child-exclusion via closest() + capture-phase click suppression + user-select guard; reduced-motion kills the transform itself; full-width dark wrapper + body-class for overscroll + accepted one-paint hydration switch; skipped-state + Restore colors decided; kids pill decided (outlined); `--accent` consumers audited, `--foreground` aligned to black; `--muted` contrast fix promoted to a global change; Settings scoped out of the Figma gate; gesture math extracted + unit-tested; e2e pool-size precondition stated; mobile-emulation Playwright project added; takeaway card gets no handlers; two-commit split.
Amended: WebKit/real-iOS coverage → documented residual risk + one manual phone check post-deploy (no WebKit in CI for this repo today; adding it is a separate decision).

## 6. Round-2 changelog

Accepted (Kimi ×2, Codex ×3): click-suppression flag cleared on next `pointerdown` + 300ms timeout (release-outside leaves capture released, click hit-tests elsewhere, consumption alone would starve the next tap); touch e2e mechanism pinned to CDP `Input.dispatchTouchEvent` after verifying Playwright 1.59's `Touchscreen` is tap-only (node_modules type defs checked by reviewer); body-class effect cleanup removes both classes on unmount (client-nav back to cream); e2e (d) retargeted to the nested shuffle button (kids pill is a card sibling; drag-from-button click synthesis not assumed); §3.5 CSP wording aligned with §2's direct-DOM transform.

## 7. Round-3 changelog

Codex: AGREE (verified CDP API, cleanup, DOM structure against the repo). Kimi: 1 blocker accepted — explicit Playwright project↔spec scoping (mobile-chromium `testMatch` restricted to the swipe spec; per-test `test.skip` gating by project name so mouse tests stay desktop-only and CDP touch tests stay mobile-only). Test-infra-only change; does not touch anything Codex verified.
