# Performance audit and fixes — DearDiary

Date: 2026-10-01
Build: Vite 5 / React 18 / TypeScript 5
Method: local production build served with production headers (`scripts/serve-with-csp.mjs`), measured with Playwright under a mid-range Android profile (4x CPU slowdown, ~1.6 Mbps, 150 ms RTT). Every number below is gzip transfer.

## Summary

Two barrel-import defects put libraries on pages that never used them. Both were fixed with a single root-cause change each. The statistics page dropped from 448.3 KB to 236.2 KB of JavaScript (−47%), and settings from 336.1 KB to 162.0 KB (−52%). No route got heavier, no behaviour changed, and the full regression suite still passes.

## Findings

| ID | Problem | Location | Measured impact | Priority | Effort |
|---|---|---|---|---|---|
| P0-1 | `jspdf` + `html2canvas` (176.7 KB gzip) loaded on `/stats` and `/settings`, which never export a PDF | `src/services/pdfService.ts:1-2`, re-exported by `src/services/index.ts:29` | −212 KB on `/stats`, −174 KB on `/settings` after fix | P0 | S |
| P0-2 | Framer Motion (37.8 KB gzip) loaded on `/calendar`, `/stats`, `/settings` via unused barrel re-exports | `src/components/ui/index.ts` (Modal), `src/components/layout/index.ts` (ComposerModal) | −40.5 KB on `/calendar` after fix | P0 | S |
| P1-1 | Framer Motion still on `/dashboard`, `/settings`, `/reader` for modals that only render on click | `src/components/ui/Modal.tsx`, `src/components/layout/ComposerModal.tsx` | up to 37.8 KB per route | P1 | M |
| P2-1 | `font-sub` (Cormorant Garamond italic, 17.8 KB) and `font-hand` (Caveat, 46.7 KB) ship with the build | `src/styles/fonts.css`, `public/fonts/` | 64.5 KB total, loaded lazily by the browser | P2 | S |

## Changes applied

### 1. Lazy-load the PDF libraries (P0-1)

`src/services/pdfService.ts` statically imported `jspdf` and `html2canvas`. Neither package declares `sideEffects: false`, so Rollup keeps a static import of them as a side-effect dependency of **every** module that reaches this file — including the `@/services` barrel, which `/stats` and `/settings` import for unrelated helpers (`computeStats`, `exportBackup`). Both pages downloaded the PDF libraries and never called them.

The two imports moved inside `exportEntryAsPdf` as a dynamic `import()`. The libraries now sit in their own chunks and load only when the function runs.

```ts
const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
  import('jspdf'),
  import('html2canvas'),
]);
```

Verified by driving the real Export button: 0 PDF-library requests before the click, 2 after, and `export-probe.pdf` downloads.

### 2. Mark the package tree-shakeable (P0-2)

`package.json` had no `sideEffects` field, so Rollup had to keep every re-export in the barrels even when nothing used it. `/calendar`, `/stats` and `/settings` each imported one small component from `@/components/ui` or `@/components/layout` and pulled Framer Motion in through the sibling re-exports of `Modal` and `ComposerModal`.

```json
"sideEffects": ["**/*.css", "**/styles/**"]
```

The array keeps the CSS chain (`src/styles/index.ts` and the `.css` files) alive, which is the only genuine module-level side effect in `src/`. All 15 regression checks and all 6 route smoke checks pass after the change, and the built CSS is byte-identical to before (7,829 bytes gzip).

## Before / after

Per-route JavaScript transfer, gzip, mobile profile:

| Route | Before | After | Delta |
|---|---|---|---|
| `/` | 109.5 KB | 108.7 KB | −0.8 KB |
| `/dashboard` | 176.2 KB | 176.9 KB | ~0 |
| `/write` | 284.2 KB | 282.6 KB | −1.6 KB |
| `/calendar` | 169.3 KB | 128.8 KB | **−40.5 KB (−24%)** |
| `/stats` | 448.3 KB | 236.2 KB | **−212.1 KB (−47%)** |
| `/settings` | 336.1 KB | 162.0 KB | **−174.1 KB (−52%)** |

Chunks removed from the two heaviest routes: `jspdf.es.min` (128.8 KB gzip) and `html2canvas.esm` (48.0 KB gzip). Both now load only on the reader's Export action.

## Verification

| Check | Result |
|---|---|
| `npm run build` | pass |
| `npm run typecheck` | pass |
| `npx eslint src` | pass |
| Per-file line limits (pages/hooks/services/utils) | pass |
| `scripts/smoke-routes.mjs` — all 6 routes render, no console errors | pass |
| `scripts/check-features.mjs` — 15 regression checks | ALL PASS |
| `scripts/check-pdf-export.mjs` — lazy PDF path works end to end | PASS |

## Risks and rollback

Both changes are one-file reverts.

- **PDF export** was the only risk: the dynamic import could keep the bundle small while breaking the one button that used it. Covered by `scripts/check-pdf-export.mjs`, which fails if the download does not appear.
- **`sideEffects`** could drop a module that must run on import. Audited: the only module-level side effect in `src/` is the localStorage probe in `src/lib/storage.ts`, whose exports are all used, so it survives. The CSS chain is preserved explicitly in the array and the built CSS is byte-identical.

## Handoff — not applied

- **Framer Motion on `/dashboard` and `/settings` (P1-1).** `Modal.tsx` uses `AnimatePresence` for a fade-and-slide that only plays on open and close. Converting it to a CSS keyframe (the pattern already used by `BookCover`, `Loading` and `GoldDust`) would remove 37.8 KB from those routes, but CSS cannot reproduce the exit animation without keeping the node mounted, which is a visible change to the dialog. Flagged rather than applied, per the rule against altering UI.
- **`font-hand` / `font-sub` (P2-1).** 64.5 KB of decorative fonts. Both are used above the fold on the landing page, so they are not waste, but subsetting them further is possible.
- **No third-party origins, no render-blocking chains, no unindexed database queries** — the app is fully offline-first with no backend, so the server, database and CDN sections of the audit do not apply.

## Note on security

The project has not been security-audited. The pre-commit security scan reports incomplete (`library_source_limit_exceeded`), so the passing build and green browser checks above are not evidence of a security clearance.
