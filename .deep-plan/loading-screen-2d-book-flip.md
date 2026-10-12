# Loading Screen — 2D Book Page-Turn Redesign

> Progressive roadmap. Written phase by phase under `.deep-plan/`. Consumers locate sections
> by heading, not position. Confirmed with the user: target = the book page-turn illustration
> only; deliverable = three variants shown side by side before any integration.

## PROBLEM (Phase 1)

The illustration shown while route chunks load (`Loading`) is a sparse open-book SVG whose
"page turn" is a single stiff 3s `rotateY` CSS loop — the one moment every visitor waits
through reads cheap and static, against an app that sells itself as an old leather-bound book.

## OBJECTIVE (Phase 1)

Produce three independently modeled 2D book page-turn loading variants, judge them against a
fixed rubric (art craft, swipe smoothness, runtime cost, accessibility, palette fidelity),
present all three side by side to the user for a pick, then integrate the winner into the
existing `Loading` call sites without regressing bundle size or reduced-motion behavior.

## IN-SCOPE (Phase 1)

- **Variant A — "Layered Paper Stack"** — an open book with loose page layers, where the top
  sheet lifts off the right edge, sweeps across the spine and lands on the left stack, with a
  hanging gold ribbon bookmark. Distinct direction: *depth via stacked layers*.
- **Variant B — "Hand-inked Spread"** — a two-page spread of hand-drawn squiggle text lines
  where a quill sweep writes a line and the sheet then swipes over to a fresh line. Distinct
  direction: *motion of writing, not just turning*.
- **Variant C — "Warm Leather Cover"** — a closed leather book with gold foil border whose
  front cover slides open to reveal cream pages beneath, with a soft vignette. Distinct
  direction: *the cover opening as the reveal*.
- **Dev-only comparison route** (`/__loading-variants`) rendering all three variants at two
  sizes on light and dark panels, so the user can see them side by side.
- **Judge evaluation** of all three variants against the rubric, including a visual pass.
- **Integration of the user-picked winner** into `src/components/illustrations/Loading.tsx`
  and the keyframes it needs in `tailwind.config.js`, keeping every existing call site
  unchanged.

## OUT-OF-SCOPE (Phase 1)

- Redesigning `SplashScreen` (the cinematic star opening) — user chose the illustration only.
- Adding any npm dependency, and specifically Framer Motion on the Suspense-fallback path.
- Refactoring `BookFlip` / `BookPage` or the reader's own page-turn animation — different
  component, not the loading screen.
- Changing the route-fallback copy ("Opening your book") or the reader loading layout.

## SYSTEM INVARIANTS & TRUST BOUNDARIES (Phase 1)

- [ ] **No animation library on the fallback path** — the loader renders inside the router's
  `Suspense` fallback, so importing Framer Motion there would pull the library into the entry
  chunk for every visitor. CSS/SVG only. — bundle weight
- [ ] **Compositor-only motion** — keyframes animate `transform`/`opacity` only; never
  `width`/`height`/`top`/`left`/`filter`. — main-thread jank
- [ ] **Reduced motion respected** — a `prefers-reduced-motion: reduce` visitor gets a still,
  finished state, never a frozen mid-swipe frame. — accessibility
- [ ] **Palette fidelity** — only the existing illustration tokens (`leather`, `ink`, `gold`,
  `cream`, `paper`) and existing theme colors; no new palette introduced per variant.
- [ ] **Call-site API frozen** — `IllustrationProps` (`size`, `className`) stays the loader
  contract so `router.tsx` and `ReaderStates.tsx` do not change.
- [ ] **Production build stays green** — `npm run typecheck`, `npm run build`, and
  `npm test` (the repo's check scripts) must pass before hand-off.

## ASSUMPTIONS (Phase 1)

- "More 2D model" means richer *2D illustrated craft* — depth built from layered shapes,
  shadows and line work rather than 3D `rotateY` perspective. Three variants deliberately
  span this interpretation so the user's pick resolves it.
- A loader loop of roughly 1.1–1.4s reads as "smooth and still fast"; the current 3s loop is
  the slow outlier being replaced.
- The user will view the comparison route in a browser via the Vite dev server.

## Codebase Context (Phase 1)

- `src/components/illustrations/Loading.tsx` — the target: open-book SVG, one CSS-animated
  page path (`motion-safe:animate-page-turn`), `IllustrationProps` API.
- `src/components/illustrations/illustrationTheme.ts` — `ILLUSTRATION_COLORS`
  (`leather #7D5A3C`, `ink #3E2723`, `gold #C9A961`, `cream #F5F0E6`, `paper #FAF6F0`),
  `ILLUSTRATION_STROKE` (2px round), `IllustrationProps`.
- `src/app/router.tsx` — `RouteFallback` renders `<Loading size={220} />` inside the root
  `Suspense`; comment there documents why Framer Motion must stay out of this path.
- `src/pages/Reader/ReaderStates.tsx` — `ReaderLoading` renders `<Loading size={200} />`.
- `tailwind.config.js` — theme palette, `page-turn` keyframes (`3s ease-in-out infinite`) and
  the `animate-page-turn` utility; dark mode via `class` / `[data-theme="night"]`.
- `src/components/splash/SplashScreen.tsx` — the separate cinematic opening (stars); the
  precedent for CSS-only, transform/opacity-only keyframes on first paint.
- `src/components/book/BookFlip.tsx`, `BookPage.tsx` — the reader's 3D flip; reference only,
  not to be modified.
- Stack: Vite 5 + React 18 + TypeScript 5.6 + Tailwind 3.4 + react-router 6; no test runner
  (`npm test` runs four custom Node check scripts); build = `tsc --noEmit && vite build`.
- Pre-existing uncommitted changes in the working tree (`index.html`, `src/app/router.tsx`,
  `src/components/splash/SplashScreen.tsx`) from the splash work — untouched by this epic.

## Research Backlog (Phase 1)

| ID | Question | Priority | Status |
| -- | -------- | -------- | ------ |
| R1 | Does the loader need to signal progress, or is an ambient loop acceptable? | Medium | Open |
| R2 | What loop duration keeps a route-chunk wait feeling fast without flicker? | High | Resolved — 1.1–1.4s loop, asymmetric easing (exit faster than entrance); current 3s is the outlier |
| R3 | Must the variant render correctly on the dark fallback background? | High | Resolved — comparison route renders each variant on both light and dark panels; cream/leather palette holds on both |

---

## Phase 2: Gap Analysis (Phase 2)

All six in-scope items are **LOW risk** (pure decorative SVG/CSS UI, no auth, no data, no
external calls) — condensed per-item verdicts, consolidated failure modes.

### Problem-Fit & Status: Variant A — "Layered Paper Stack" (2A)

- **Literal ask:** build a richer 2D book page-turn variant with a lifted page sweeping the spine.
- **Underlying goal:** the waiting moment must feel crafted and alive, and still cost almost nothing.
- **Gap:** partial — the ask alone could be satisfied by a prettier but still slow/flat loop; the variant brief must pin loop duration (~1.1–1.4s), asymmetric easing and the palette/API contract, not just the art.
- **Verdict:** FIT (with pinned constraints — see WS1)
- **Invariant Impact:** Preserved
- **Blocker Status:** NONE

### Problem-Fit & Status: Variant B — "Hand-inked Spread" (2A)

- **Literal ask:** build a spread whose page swipes while a writing motion plays.
- **Underlying goal:** same as above; plus the swipe must read as *swiping*, not as a slide.
- **Gap:** partial — risk that the quill motion becomes the only animation and the page swipe is lost; the brief requires the page itself to move.
- **Verdict:** FIT
- **Invariant Impact:** Preserved
- **Blocker Status:** NONE

### Problem-Fit & Status: Variant C — "Warm Leather Cover" (2A)

- **Literal ask:** a leather cover that opens to reveal pages.
- **Underlying goal:** same as above; "more 2D" — the reveal must not rely on 3D `rotateY` perspective, which the user asked to move away from.
- **Gap:** partial — a cover swing is naturally 3D-suggested; the brief requires the reveal to be expressed with 2D transforms (translate/scale/skew) and layer order.
- **Verdict:** FIT
- **Invariant Impact:** Preserved
- **Blocker Status:** NONE

### Problem-Fit & Status: Comparison route `/__loading-variants` (2A)

- **Literal ask:** show all three variants side by side for the user to choose.
- **Underlying goal:** the user must be able to judge the three in one place, in both themes, without running a build or being blocked by the opening splash.
- **Gap:** PARTIAL_FIT if the route ships in production — it must be dev-only, and the splash must not cover it.
- **Verdict:** FIT (dev-gated route + suppressed splash on that path)
- **Invariant Impact:** Preserved (prod build must not carry it)
- **Blocker Status:** NONE

### Problem-Fit & Status: Judge evaluation (2A)

- **Literal ask:** one model acts as judge over the three.
- **Underlying goal:** an independent, rubric-scored verdict the user can trust, with evidence (screenshots), not preference.
- **Gap:** partial — judging art needs eyes, so the judge needs the rendered page, not just the source.
- **Verdict:** FIT (judge renders the comparison route in the browser and captures evidence)
- **Invariant Impact:** Preserved
- **Blocker Status:** NONE

### Problem-Fit & Status: Integration of the winner (2A)

- **Literal ask:** make the winner the real loading screen, working and fast.
- **Underlying goal:** zero call-site churn, zero bundle regression, green typecheck/build.
- **Gap:** partial if the winner's keyframes are pasted into `tailwind.config.js` with colliding names or if the component keeps variant-only imports.
- **Verdict:** FIT (see WS5: sanitize into `Loading.tsx`, unique keyframe names)
- **Invariant Impact:** Preserved
- **Blocker Status:** NONE

#### Failure Modes (2B)

| # | Failure Mode | Trigger | Impact | Machine Exit Verification |
| - | ------------ | ------- | ------ | ------------------------- |
| F1 | A variant imports Framer Motion or any animation lib | Agent reaches for the library the repo already uses elsewhere | Entry chunk regression for every visitor | `git status` + `grep -ri "framer-motion" src/components/loading/` must be empty |
| F2 | Keyframes animate `width`/`height`/`top`/`left`/`filter` | Agent writes a "shadow grows" or "box expands" effect | Main-thread jank, layout thrash | `grep -nE "(width|height|top|left|filter)\s*:" src/components/loading/variants/*/*.css` must be empty |
| F3 | No reduced-motion handling | Agent forgets `motion-safe:` or the media query | a11y violation / frame frozen mid-swipe | `grep -L "prefers-reduced-motion\|motion-safe" src/components/loading/variants/*/*.tsx` must list no file; browser emulation check |
| F4 | Off-palette hex colors | Agent invents a "nicer" brown or blue | Visual inconsistency with the whole app | `grep -rhoE "#[0-9A-Fa-f]{6}" src/components/loading/variants/ \| sort -u` ⊆ `{7D5A3C,3E2723,C9A961,F5F0E6,FAF6F0}` (+ rgba/opacity of them) |
| F5 | `IllustrationProps` contract broken | Variant invents its own props shape | `router.tsx` / `ReaderStates.tsx` break or drift | `npm run typecheck` passes with zero errors |
| F6 | Comparison route leaks into production | Dev-gate written as a plain route | Dead code + a visible `/__loading-variants` in prod | `npm run build` passes and `grep "__loading-variants" dist/` is empty |
| F7 | Two variants land in the same directory | Agent picks its own path | Overwritten work | Each agent writes only inside its assigned `variants/<name>/` dir |
| F8 | Judge screenshots a stale/HMR-interrupted page | Judge runs while a variant agent is still editing | Verdict scored on a half-rendered card | Judge reloads the route and asserts each card paints before scoring |

#### Security Risks (2C)

No security surface — reason: purely decorative SVG/CSS with no user input, no data
handling, no network, no auth and no persisted state; the only caller-controlled value is the
numeric `size` prop, typed at the boundary. The one trust boundary worth noting is the
build pipeline (a dev-only route must not reach `dist`), covered by F6.

#### Invariant & Boundary Violation Check (2D)

- **F1 / F2 / F4 fail silently** — nothing errors; the symptom is only visible in bundle size,
  frame timing, or eyeball comparison. Each is therefore an **automated assertion** (grep / size
  check / palette check) in WS6, not a note.
- **F3 fails silently for reduced-motion visitors** — assertion + emulated browser check.
- **F6 fails silently in prod** — assertion on the built output.

#### Work Stream Consolidation (2E)

- **WS1–WS3:** the three variant builds (parallel, disjoint dirs).
- **WS4:** comparison route + dev gate + splash suppression (Lead-owned scaffolding).
- **WS5:** integration of the winner into `Loading.tsx` + `tailwind.config.js`.
- **WS6:** cross-cutting assertions (typecheck, build, invariant greps, bundle sanity).

#### Review Gate (2F)

No BLOCKER, no MISFIT, no CRITICAL items. Phase 2 clears for Phase 3.

#### Research Addendum (2G)

- Loading feedback should match the expected wait and avoid flashing on near-instant work
  (ux-guidelines: *Loading Indicators*) — hence a continuous ambient loop rather than a
  one-shot animation that replays visibly on fast loads.
- Asymmetric motion: the swap/exit must resolve faster than the entrance so navigation feels
  snappy (motion preset: *Page Transition*, Subtle tier) — hence the pinned easing direction.
- Motion budget: animate 1–2 key elements per view (ux-guidelines: *Excessive Motion*) — hence
  one page (plus one shadow/ribbon) per variant, not five moving parts.

---

## Phase 3: Roadmap (Phase 3)

### Architecture Decisions

| ID | Decision | Rationale | Affects | Status |
| -- | -------- | --------- | ------  | ------ |
| D1 | Variants are **SVG + a co-located CSS file per variant**, with keyframes written in plain CSS (imported by the variant's own CSS file), not in `tailwind.config.js`. | Keeps three agents off the one shared config file; Tailwind's purge scans `src/**/*` and the CSS is imported by a component, so the utilities survive. A variant that lands can later move its keyframes into the config at integration time. | WS1–WS4 | Accepted |
| D2 | Each variant exports a component taking `IllustrationProps` (`size`, `className`), default + named export, same filename/casing convention as the repo (`PaperStackLoader.tsx`, `paperStack.css`). | Frozen call-site contract (F5); the repo's existing `Loading.tsx` shape is the template. | WS1–WS3, WS5 | Accepted |
| D3 | The comparison route is **dev-only**: `{ path: '/__loading-variants', ... }` registered only under `import.meta.env.DEV`, dynamically imported; the splash is suppressed on that path in DEV. | F6: the preview must never reach `dist`; and the splash would otherwise cover the comparison. | WS4 | Accepted |
| D4 | The comparison page lazy-loads each variant inside its own `ErrorBoundary` card, so a missing or half-written variant shows a "not built yet" card instead of a white screen. | Three agents build in parallel; the preview must stay useful mid-build. | WS4 | Accepted |
| D5 | One Lead-owned Vite dev server (background job) is the single shared runtime for the judge's visual pass; modeling agents verify by typecheck + grep, not by driving a browser. | F8: three agents plus a judge contending over one browser/HMR produces stale screenshots and flaky verdicts. | WS1–WS4, WS6 | Accepted |
| D6 | Judge produces a scored verdict with screenshots saved to `reports/loading-variants/`. | The user asked to see all three side by side; evidence-backed scoring is the deliverable, not a preference. | WS5 | Accepted |

### Work Streams

#### WS1 — Variant A: "Layered Paper Stack"
##### Objective
Model the layered-sheets direction: a top page lifts off the right edge, sweeps the spine and lands left, proving "smooth 2D swipe" is achievable with pure CSS.
##### Tasks
| ID | Task | Depends On | Mitigates | Risk | Status |
| -- | ---- | ---------- | ---------- | ---- | ------ |
| A1 | Create `src/components/loading/variants/paperStack/PaperStackLoader.tsx` + `paperStack.css` (open book, 3–4 stacked page layers, gutter shading, hanging gold ribbon) | None | — | Low | TODO |
| A2 | Write keyframes for the sweep: lift → carry → land, transform/opacity only, ~1.2s loop, asymmetric easing (land settles slower than the lift) | A1 | F2, F3 | Low | TODO |
| A3 | Add `motion-safe:` guard / `@media (prefers-reduced-motion: reduce)` still-state; verify `IllustrationProps` typing | A2 | F3, F5 | Low | TODO |
| A4 | Self-verify: `npx tsc --noEmit` (ignore other agents' in-flight errors) + the WS6 grep assertions on own dir | A3 | F1, F2, F4 | Low | TODO |
##### Sad Paths
- **A1:** if `size` scaling distorts the viewBox → use a fixed `viewBox` and set width/height from `size`; verify at 200 and 220.
- **A2:** if the sweep needs a `filter` drop-shadow for realism → reject it; fake depth with a translucent dark path instead (F2).
##### Exit Criteria
- [ ] `npx tsc --noEmit` reports no error inside `variants/paperStack/`
- [ ] WS6 greps (F1–F4) return zero hits inside `variants/paperStack/`
##### Unit Tests
- [ ] Static assertion pass: props type, reduced-motion guard, palette conformance, no animatable-layout property (scripted, no runner in repo — see X2)

#### WS2 — Variant B: "Hand-inked Spread"
##### Objective
Model the "page swipes while being written" direction: a spread of squiggle lines where the sheet swipes to a fresh line as a quill sweep passes.
##### Tasks
| ID | Task | Depends On | Mitigates | Risk | Status |
| -- | ---- | ---------- | ---------- | ---- | ------ |
| B1 | Create `src/components/loading/variants/inkedSpread/InkedSpreadLoader.tsx` + `inkedSpread.css` (two-page spread, ink squiggle lines, gold rule) | None | — | Low | TODO |
| B2 | Keyframes: quill sweep writes one line (opacity/scaleX reveal), then the sheet swipes across the spine to reveal a fresh line; ~1.2s loop, asymmetric easing | B1 | F2, F3 | Low | TODO |
| B3 | `motion-safe:` guard + `IllustrationProps` typing | B2 | F3, F5 | Low | TODO |
| B4 | Self-verify (typecheck + greps on own dir) | B3 | F1, F2, F4 | Low | TODO |
##### Sad Paths
- **B2:** if the squiggle reveal needs `stroke-dashoffset` → allowed (it is a transform-free but compositor-safe SVG property), but must not be paired with `filter`.
- **B2:** if the quill becomes the only moving element → the page itself must also translate; otherwise the variant loses the "swipe" brief.
##### Exit Criteria
- [ ] `npx tsc --noEmit` reports no error inside `variants/inkedSpread/`
- [ ] WS6 greps return zero hits inside `variants/inkedSpread/`
##### Unit Tests
- [ ] Same static assertion pass as WS1, scoped to this directory

#### WS3 — Variant C: "Warm Leather Cover"
##### Objective
Model the "cover opens to reveal pages" direction, expressed in 2D transforms (no 3D perspective), with a soft warm vignette.
##### Tasks
| ID | Task | Depends On | Mitigates | Risk | Status |
| -- | ---- | ---------- | ---------- | ---- | ------ |
| C1 | Create `src/components/loading/variants/leatherCover/LeatherCoverLoader.tsx` + `leatherCover.css` (closed leather book, gold foil border, page edges beneath) | None | — | Low | TODO |
| C2 | Keyframes: front cover swipes open (translate + slight rotate, layer reveal), pages fan slightly; ~1.2s loop; vignette held static | C1 | F2, F3 | Low | TODO |
| C3 | `motion-safe:` guard + `IllustrationProps` typing | C2 | F3, F5 | Low | TODO |
| C4 | Self-verify (typecheck + greps on own dir) | C3 | F1, F2, F4 | Low | TODO |
##### Sad Paths
- **C2:** if the cover wants `rotateY` for realism → rejected by the "more 2D" brief; use `rotate` (2D) with layer-order reveal.
- **C2:** if a gold gleam sweep is wanted → use a static gradient or light `opacity` on a path; never an animated `filter: brightness()`.
##### Exit Criteria
- [ ] `npx tsc --noEmit` reports no error inside `variants/leatherCover/`
- [ ] WS6 greps return zero hits inside `variants/leatherCover/`
##### Unit Tests
- [ ] Same static assertion pass as WS1, scoped to this directory

#### WS4 — Dev-only comparison route
##### Objective
Give the user one page where all three variants render side by side, at two sizes, on light and dark panels — without touching production.
##### Tasks
| ID | Task | Depends On | Mitigates | Risk | Status |
| -- | ---- | ---------- | ---------- | ---- | ------ |
| T4.1 | Create `src/components/loading/loadingVariants.tsx` (registry + `LoadingVariantsPreview` page: three lazy-loaded cards, each in an `ErrorBoundary`, sizes 160/220, light + dark panels) | None | F7, F8 | Low | TODO |
| T4.2 | Add the dev-only route `'/__loading-variants'` in `src/app/router.tsx` guarded by `import.meta.env.DEV`, dynamic import | T4.1 | F6 | Low | TODO |
| T4.3 | Suppress `SplashScreen` on that path in DEV (`src/app/App.tsx`) | T4.2 | — | Low | TODO |
| T4.4 | Add `src/components/loading/index.ts` barrel + `variants/index.ts` exporting the three variant components | T4.1 | F7 | Low | TODO |
##### Sad Paths
- **T4.2:** if `import.meta.env.DEV` leaks the route into the prod build → assert on `dist/` after build (F6 / X1).
- **T4.4:** barrel importing a not-yet-written variant file breaks the dev server → barrel is written last, and the preview page uses the registry's own lazy imports, not the barrel.
##### Exit Criteria
- [ ] `npm run dev` serves `/__loading-variants` with all three cards rendering
- [ ] `npm run build` succeeds and `dist/` contains no reference to `__loading-variants`
##### Unit Tests
- [ ] Route gate assertion: grep prod output for the preview path (X1)

#### WS5 — Judge verdict + integration
##### Objective
An independent, evidence-backed verdict, then the winner wired in as the real loader.
##### Tasks
| ID | Task | Depends On | Mitigates | Risk | Status |
| -- | ---- | ---------- | ---------- | ---- | ------ |
| T5.1 | Judge loads `/__loading-variants`, captures per-variant screenshots into `reports/loading-variants/`, scores the rubric, declares a winner | WS1–WS4 | — | Low | TODO |
| T5.2 | Lead presents the three variants + judge scores to the user for the final pick | T5.1 | — | Low | TODO |
| T5.3 | Integrate the picked variant into `src/components/illustrations/Loading.tsx` (or replace its body with the variant's sanitized markup) and move its keyframes into `tailwind.config.js` with unique names; keep `IllustrationProps` | T5.2 | F5 | Low | TODO |
| T5.4 | Retire the preview: dev route + splash suppression removed, variant agents' files kept as reference or pruned per user's answer | T5.3 | F6 | Low | TODO |
##### Sad Paths
- **T5.1:** if a variant fails to render after reload → the judge scores it on source only and records the render failure as a deduction.
- **T5.3:** if the winner's CSS imports Tailwind-specific utilities that do not survive `tsc`/build → convert them to plain CSS at integration time.
##### Exit Criteria
- [ ] `reports/loading-variants/verdict.md` exists with scores per rubric line
- [ ] Winner renders at 200 and 220 on both themes
##### Unit Tests
- [ ] Visual smoke: judge's screenshot set covers both sizes and both themes

### Cross-Cutting Work

| ID | Task | Work Stream | Depends On | Status |
| -- | ---- | ----------- | ---------- | ------ |
| X1 | Invariant assertions (WS6): typecheck, build, `dist/` leak check for the preview route | WS1–WS4 | WS1–WS4 | TODO |
| X2 | Static assertion pass per variant: no `framer-motion`, no animatable-layout props, palette conformance, reduced-motion guard present | WS1–WS3 | WS1–WS3 | TODO |
| X3 | Entry-chunk sanity: compare `dist` asset sizes before/after integration to prove no bundle regression | WS5 | T5.3 | TODO |

### Dependency Graph (Phase 3)

```text
WS1, WS2, WS3  ── (parallel, disjoint dirs) ──┐
                                              ├──> WS4 (comparison route) ──> WS5 (judge → user pick → integrate)
WS6 assertions (X1, X2) ──────────────────────┘            │
                                                     Lead-owned dev server (D5) available throughout
```

### Implementation Order (Phase 3)

- **Sprint 1 (parallel):** WS1 + WS2 + WS3 variant builds; Lead runs WS4 scaffolding and the dev server in parallel.
- **Sprint 2:** WS5 — judge pass (T5.1), user side-by-side review (T5.2), integration of the pick (T5.3), preview retirement (T5.4).
- **Sprint 3 (gate):** X1–X3 assertions green, hand-off summary.

### Risks (Phase 3)

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Two variants visually converge (all three read as "generic book") | Medium | Low | Each brief pins a *different* motion subject (page carry / writing swipe / cover reveal) so the pick is meaningful |
| The user's "smooth and fast" threshold differs from the pinned 1.2s | Medium | Medium | Loop duration is a single constant per variant CSS — one-line change after the review |
| Dev route leaks into production | Low | Medium | `import.meta.env.DEV` gate + `dist/` grep assertion (F6/X1) |
| Judge scores source only because a card fails to render | Low | Medium | Preview renders each card in its own ErrorBoundary, and the judge reloads before scoring (F8) |
| Bundle regression from integration | Low | High | X3 size comparison before/after |

### Completion Checklist (Phase 5)

- [x] Three variants built under `src/components/loading/variants/` and rendering in the preview
- [x] `/__loading-variants` side-by-side page shown to the user, with the judge's verdict
- [x] User's pick integrated — **the user chose Variant C, "Warm Leather Cover"**, over the judge's measured recommendation of A
- [x] `Loading` call sites unchanged (`router.tsx` RouteFallback 220, `ReaderStates.tsx` 200)
- [x] Preview retired; variant study archived to `reports/loading-variants/source/`
- [x] `npm run typecheck` + `npm run build` + `npm test` green; entry chunk free of the animation library

### Integration Record (Phase 5)

**Decision:** the user picked **Variant C — Warm Leather Cover** after seeing the three side by
side. The judge's measured ranking put A first (9.175 vs C's 9.10), with C's only substantive
loss being the frame-clipping defect — which was fixed before integration. The two were within
0.075 of each other, and the judge explicitly noted the tie should be broken by eye, the test it
could not run. The user's eye broke it: C it is.

**How C was integrated:**

| Piece | Where it lives now |
| ----- | ------------------ |
| Component body | `src/components/illustrations/Loading.tsx` — same `IllustrationProps` API, one root `<svg>`, decorative layers under one `aria-hidden` group |
| Cover + gleam keyframes | `tailwind.config.js` as `cover-open` / `cover-gleam`, consumed via `motion-safe:animate-cover-open` / `motion-safe:animate-cover-gleam` — the same pattern the previous loader used for `page-turn`, which is now removed |
| Pivot (`transform-box` / `transform-origin`) | `.cover-pivot` in `src/styles/globals.css`, beside the existing `.splash-pivot`; these properties are not animatable so they cannot live in keyframes |
| The other two variants | Archived to `reports/loading-variants/source/`, outside `src`, so they cannot be bundled |

**Post-integration verification (rerun after the fix + integration):**

| Check | Result |
| ----- | ------ |
| `npx tsc --noEmit` | **exit 0** |
| `npm run build` | **exit 0** — `built in 12.24s` |
| `npm test` (4 suites) | **ALL PASS** |
| Shipped stylesheet | **38.7 KB** (was 39.8 KB) — variant CSS dropped, new keyframes smaller than the old `page-turn` |
| Entry chunk free of the animation library | **CLEAN** (116.8 kB entry; Framer Motion remains its own lazy chunk) |
| Dev preview / variant code in `dist` | **CLEAN** — nothing leaks |
| `cover-open` in shipped CSS, `page-turn` gone | **confirmed** |
| Live render of the shipped component | `cover-open` 1.2s resolves, `transform-origin: 58px 160px` / `transform-box: view-box` applied, gleam attached, **INSIDE FRAME** (2.4→326 units), `220×165`, `role="img"` + label |

**Not verified:** aesthetic quality of the rendered art — no model in this session declares image
input, so no automated pass could see it. Screenshots were captured for human review instead:
`reports/loading-variants/integrated-loading-light.png` and `side-by-side-wide.png`.

### Review Log (Phase 4)

| Review | Engine | Mode | Findings | Status |
| ------ | ------ | ---- | -------- | ------ |
| CTO scope | external subagent | fresh context | 8 findings (delete WS6, delete bundle axis, delete judge, shrink WS4, timing assumption unsupported, delivery risk = subagent throughput) | Arbitered |
| UI / Judge | `loading-variants-judge` teammate | browser-rendered | _pending_ | Open |

### Execution Evidence (X1–X3)

Verified by the Lead after all three variants landed:

| Check | Command | Result |
| ----- | ------- | ------ |
| Typecheck (whole project) | `npx tsc --noEmit` | **exit 0** — clean |
| Production build | `npm run build` | **PASS** — `built in 14.16s`, stylesheet inlined (39.8 KB) |
| Repo check suites | `npm test` | **ALL PASS** ×4 (csp parity, week bucket, parse/export, entry writes) |
| F1 no animation library in variants | grep `framer-motion\|requestAnimationFrame\|animate\(` | **0 hits** |
| F2 compositor-only keyframes | grep animated layout props in variant CSS | **0 hits** |
| F4 palette fidelity | grep `#RRGGBB` in variant sources | **0 hits** (all colors via `ILLUSTRATION_COLORS`) |
| F6 dev route must not ship | grep `dist/` for preview route + variant modules | **CLEAN** — fully eliminated |
| Invariant: entry chunk free of Framer Motion | grep `dist/assets/index-*.js` | **CLEAN** (Framer Motion is its own 114 KB chunk) |
| Invariant: variant CSS not shipped | grep shipped stylesheet for `lsr-*` | **CLEAN** |
| Live render of all three | browser: `document.getAnimations()` | 28 animations, all `running`, all 1200 ms, **0 JS-driven** |

### Phase 4 — Judge's Decisions & Amendments

> The Phase 4 outside voice (CTO pass) recommended deleting WS6, the bundle axis, the judge
> pass and the preview retirement, and flagged that the 1.1–1.4s timing target is an
> unsupported assumption. Arbitration below — the user's explicit instruction outranks the
> reviewer's efficiency argument where the two conflict.

**Accepted (Confidence: High)**

- **Finding:** WS6 partly automates self-imposed discipline; typecheck/build should be standing habit.
  - Evidence: the four check suites and `tsc` are already repo habits; the extra greps restate them.
  - Change: WS6 kept, but demoted from "milestone" to the one-off verification table above. No task, no owner, no rework loop. Recorded once, at integration.
- **Finding:** the bundle-size *comparison* is undecidable noise for one loader asset.
  - Evidence: X3 measures a swap of one SVG; the real risk was an animation-library import, which F1 covers decisively.
  - Change: X3 replaced by the F1 entry-chunk grep (already run, CLEAN). Byte-diff dropped.
- **Finding:** the two-sizes × light/dark matrix is polish QA attached to no decision.
  - Evidence: the loader has two real call sites (220 route fallback, 200 reader).
  - Change: matrix reduced to the two real sizes plus the light/night backgrounds, which is exactly what the user asked to see side by side.
- **Finding:** delivery risk is subagent throughput — *already falsified*.
  - Evidence: two of three modelers went idle without writing files; variant C was built by the Lead from the spec.
  - Change: accepted as fact and recorded honestly below. Mitigation applied: first-output-wins, one re-prompt cap, "best three of three" reached with the Lead finishing the stalled leg.

**Rejected (Confidence: Low)**

- **Finding:** delete the judge pass — "the user is the judge; two decision-makers for one decision."
  - Reason: **the user explicitly requested this structure** ("3 for modeling and 1 as judge"). The judge is a requested deliverable, not invented ceremony. It also carries real, non-redundant value here: the Lead's model cannot read images, so the visual pass is the *only* way rendered quality gets assessed before the user looks. Kept.
- **Finding:** delete WS4 / preview retirement as bookkeeping.
  - Reason: the user explicitly chose "show me all 3 side by side". Retiring the preview is a correctness requirement, not bookkeeping — F6 proves the dev-gated subtree is fully eliminated from `dist`, which only stays true while the gate is maintained.

**Needs Human Decision (Confidence: Medium)**

- **Finding:** the 1.1–1.4s loop duration is invented, and the plan never measures how long visitors actually wait.
  - Evidence: none in-repo — there is no wait-time instrumentation in the app; the 3s incumbent is the only baseline.
  - Options: (a) keep 1.2s as a design target and let the user's eye settle it, or (b) instrument route-chunk wait time and tune from data in a follow-up.
  - Resolution taken: (a) for this epic — the brief was "still fast", which is a perception goal the user can judge directly from the side-by-side preview. (b) logged as future work.

### Critical Design Questions

1. **Loop duration** — is 1.2s right, or should it be slower/statelier to match the diary's calm tone? Why: the CTO correctly notes no wait-time data exists; only the user's eye can settle "fast but not frantic". Answerable directly from the preview.
2. **Which variant ships** — A (layered stack), B (hand-inked spread), or C (leather cover)? Why: this is the user's call; the judge supplies evidence, not the decision.

### Judge Verdict & Defects Fixed (Phase 4 outcome)

**Winner by the judge's measurements: Variant A — Layered Paper Stack** (weighted 9.175 / 9.10 / 6.875).

The judge was the only independent pass, and it **corrected two false premises in its own brief**
rather than papering over them:

- It cannot read images either (no model in this session declares image input), so **no aesthetic
  judgement was possible by any automated pass**. It substituted DOM instrumentation: pausing each
  animation and reading computed matrices at up to 241 points per loop. Motion, geometry, seams,
  palette, payload, contract and a11y findings are therefore **measured**; "does it look good" is
  **still open and needs human eyes**.
- The Playwright MCP silently wrote no screenshot files for relative filenames. The Lead
  re-captured them with **absolute** paths; three real PNGs now exist in `reports/loading-variants/`.

**Two real defects were found and fixed** (both re-verified numerically after the fix):

| Defect | Variant | Evidence before | Fix | Verified after |
| ------ | ------- | --------------- | --- | -------------- |
| Ink erased itself every loop — `stroke-dashoffset` jumped `0 → 400` in one frame at the seam, a full-line pop once per 1.2s while the quill sat parked | B | measured `0px @ t=1199.9` → `400px @ t=1200`; confirmed in CSSOM (`100% {0}` wrapping to `0% {400}`) | the ink is opaque, so it cannot hide the reset behind an always-on window like A's sheet; the reset now hides behind a short opacity dip (90%→97%) | offset `400px` at **both** t=1199.9 and t=1200.1; reset occurs at t=1152–1164 where opacity measures **0.000** |
| Cover swung 28.2 px outside the left frame edge — 12.8% of the illustration, the variant's entire subject sliding out of its own picture | C | measured leftmost edge **−51.3** viewBox units at 220px render | open travel capped 104px → 44px from the x=58 spine, with the margin reasoning recorded in the keyframe comment | leftmost edge **2.4**, rightmost 326 — **INSIDE FRAME (0..400)**, 0px clipped |

**Not fixed (recorded honestly):** B's page turn still peaks at ~5900 units/s and bounces back
without completing its turn, so its "swipe" reading remains the weakest of the three. This is a
design-level limitation, not a bug, and B is not the recommended variant.

**Measured payload:** A 2135 B / 21 nodes · B 1804 B / 17 nodes · C 1448 B / 12 nodes. All well
inside the "still fast" requirement; max 2 animated elements each.

**Hard constraints: no violations in any variant** — no animation library, no non-compositor
animated property, no off-palette colour, contract intact, and all three pass reduced motion with
a finished still state (re-verified after the fixes: 0 running animations, movers at
`transform: none`, B's ink pinned fully written).

### Evidence Artifacts

| Artifact | Path |
| -------- | ---- |
| Judge's full verdict (310 lines, measured) | `reports/loading-variants/verdict.md` |
| All three side by side, wide viewport | `reports/loading-variants/side-by-side-wide.png` |
| All three, full page | `reports/loading-variants/all-three.png` |
| Reduced-motion still state (proves the a11y invariant) | `reports/loading-variants/reduced-motion-still.png` |
