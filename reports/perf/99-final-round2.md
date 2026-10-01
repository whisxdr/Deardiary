# Performance audit and fixes — DearDiary, round 2

Date: 2026-10-01
Build: Vite 5 / React 18 / TypeScript 5
Method: local production build served with production headers (`scripts/serve-with-csp.mjs`), measured with Playwright under mid-range Android profile (4x CPU, ~1.6 Mbps, 150 ms RTT). Every number below is gzip transfer. Prior round at `reports/perf/99-final.md` fixed two barrel-import defects (-47% /stats, -52% /settings).

## Summary

Prior bundle fixes verified still in place. This round found no new bundle bloat. Applied 10 small runtime fixes: stable callbacks so memo cards skip re-render, memoized hot paths, parse-once sorts, dead hook removed. No route got heavier. Full suite green.

## Findings

| ID | Problem | Location | Measured impact | Priority | Effort |
|---|---|---|---|---|---|
| R-1 | `memo(EntryCard)` defeated by new callback identity each render | `Dashboard.tsx:77`, `useFilter.ts:37` | every mounted card re-rendered on any dashboard render | P1 | S |
| R-2 | `byDay` reduce + day interval rebuilt each calendar render | `CalendarGrid.tsx:17` | O(N) date-key work on month nav, day select | P1 | S |
| R-3 | `new Date` twice per sort comparison | `entryFields.ts:23`, `useFilter.ts:23,29` | 2 parses per comparison on every read, filter, sort | P1 | S |
| R-4 | DOMPurify full parse per reader render, no memo | `ReaderContent.tsx:19` | full HTML parse each render | P1 | S |
| R-5 | `estimateUsage` scanned every stored key during render | `DataSection.tsx:45`, `AboutSection.tsx:30` | localStorage scan each render | P2 | S |
| R-6 | Dead `useSearch` hook, no consumer | `hooks/useSearch.ts` | dead code, duplicated `useFilter` search path | P2 | S |
| R-7 | Backup export pretty-printed full list | `exportService.ts:66` | ~33% larger JSON string built synchronously | P2 | S |
| R-8 | Avatar image missing `decoding="async"` | `Avatar.tsx:41-48` | minor decode jank | P2 | S |

## Changes applied

1. `useFilter`: `update` + `reset` wrapped in `useCallback`. `Dashboard`: `clearAll`, tag click, search change wrapped in `useCallback`. Cards with stable props now skip re-render.
2. `CalendarGrid`: `days` + `byDay` wrapped in `useMemo([month])` / `useMemo([entries])`.
3. `byNewest` + `sortEntries` (date orders): decorate-sort-undecorate, parse once per entry.
4. `ReaderContent`: `sanitizeEntryHtml(content)` wrapped in `useMemo([content])`.
5. `DataSection` + `AboutSection`: `estimateUsage()` wrapped in `useMemo([entries.length])`.
6. Deleted `src/hooks/useSearch.ts`, removed barrel export.
7. `exportBackup`: dropped `null, 2` pretty-print.
8. `Avatar`: added `decoding="async"`.

## Before / after

Per-route JavaScript transfer, gzip, mobile profile. Runtime fixes touch no chunks, so payload identical to prior round:

| Route | Before (round 1 after) | After (this round) | Delta |
|---|---|---|---|
| `/` | 108.7 KB | 108.7 KB | 0 |
| `/dashboard` | 176.9 KB | 177.0 KB | ~0 |
| `/write` | 282.6 KB | 282.6 KB | 0 |
| `/calendar` | 128.8 KB | 128.8 KB | 0 |
| `/stats` | 236.2 KB | 236.2 KB | 0 |
| `/settings` | 162.0 KB | 162.0 KB | 0 |

Gains this round are render work, not bytes: fewer re-renders, fewer date parses, fewer DOMPurify passes.

## Verification

| Check | Result |
|---|---|
| `npm run build` | pass |
| `npm run typecheck` | pass |
| Per-file line limits (pages/hooks/services/utils/components) | pass |
| `scripts/check-features.mjs` — 15 regression checks | ALL PASS |
| `scripts/check-composer.mjs` — composer invariants | ALL PASS |
| `scripts/smoke-routes.mjs` — all 6 routes render, no console errors | pass |
| `scripts/check-pdf-export.mjs` — lazy PDF path works end to end | PASS |

## Risks and rollback

Each change is one-file revert. No behavior changed: same filter results, same sort order, same sanitize output, same backup content (only whitespace differs in exported JSON, still valid backup).

## Handoff — not applied

- **Framer Motion on `/dashboard`, `/write`, `/settings`, `/reader` for click-gated dialogs (P1-1 from round 1).** Still live. Converting `Modal`/`ComposerModal` to CSS keyframes drops exit animation, visible UI change. Flagged not applied.
- **Write autosave signature `JSON.stringify` per keystroke, editor word-count regex per keystroke, full-collection JSON parse per mutation, `computeStats` multi-pass on Stats mount.** Real but each needs larger refactor (isolate editor state, paginate storage, single-pass stats). Flagged as next round with measurements.
- **Landing lazy route gates LCP behind JS, 3 of 5 above-fold fonts not preloaded, theme flash on boot.** Structural SPA tradeoffs. Need prerender or inline-shell decision first.
- **No backend, no RUM, no third-party origins in render path** — server, database, CDN sections do not apply. App fully offline-first.

## Note on security

Project not security-audited. Pre-commit scan reports incomplete, so green checks above are no security clearance.
