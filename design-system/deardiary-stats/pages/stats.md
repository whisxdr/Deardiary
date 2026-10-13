# Stats Page — Approved Direction

> **Status: APPROVED by the user on 2026-10-13.** This file is the authoritative build spec for
> `src/pages/Stats/`. It overrides `MASTER.md` for this page.
> **Chosen direction: A — The Archivist's Ledger.**

---

## Decision

Of the three sketches produced (`../sketches/`), the user selected **Direction A — The
Archivist's Ledger**.

- **Full spec:** [`../sketches/ink-ledger/SKETCH.md`](../sketches/ink-ledger/SKETCH.md) — the
  build-ready source of truth. Read it before writing any component.
- **Visual reference:** [`../sketches/ink-ledger/mockup.html`](../sketches/ink-ledger/mockup.html) —
  open in a browser; the target look, with a working light/night toggle.
- Rejected for this page (kept for reference / possible later reuse):
  - **B — Modern Bento** (hero KPI + bento grid + direct-labeled charts)
  - **C — A Year in Pages** (scroll-triggered storytelling + bookmark ribbon)

## The idea in one line

The stats page becomes **the ledger an archivist keeps beside the diary**: one continuous ruled
sheet with a red margin rule down the left, numbered ledger rows (01–10) instead of ten floating
cards, handwritten Caveat notes in the margin, the top mood as a rotated ink stamp, and index-tab
chapter dividers.

## Non-negotiable rules when implementing

1. **Follow `ink-ledger/SKETCH.md` exactly** for layout, tokens, typography, and component
   structure. Deviations get recorded in §Decisions below, not made silently.
2. **No new color tokens without user approval.** The spec proposes two optional additions —
   `accent-gold-deep #6F5220` (small gold text on cream) and `ledger-rule #D98A7E` (the red margin
   rule). Until approved, use the documented fallbacks: `text-primary-700` for small gold-ish text,
   `border-primary-400` for the margin rule.
3. **Keep every data field the current page shows.** All 10 tiles survive:
   total entries, writing streak, top mood, total words, average per week, mood distribution,
   activity by hour, popular tags, favorites, writing activity heatmap.
4. **No emoji as icons** (project has `lint:emoji`). Use inline SVG or Phosphor by name.
5. **Contrast is math, not vibes.** Body/label text ≥4.5:1, large text ≥3:1, verified against the
   real token hexes. Gold (`#C9A961`) is fill/hairline/large-display only in light mode — never
   small text (it is 1.98:1 on cream).
6. **Never color alone** in charts: swatch + text label + value on every mood row, numeric direct
   labels on chart peaks, active-day count in text, Less→More legend on the heatmap.
7. **Dark mode must work** via the existing `[data-theme='night']` variables — the ink stamp flips
   to `--mood-stamp-ink`'s night value, exactly as `theme.css` already intends.
8. **Reduced motion + keyboard nav + ≥44px touch targets** are part of "done", not follow-ups.
9. **Don't break the build**: `npm run typecheck`, `npm test`, `npm run build` must all pass.
10. **Responsive at 375 / 768 / 1440px.** The margin column collapses to a Caveat note above each
    row on mobile; the heatmap scrolls inside its row so the page never widens.

## Implementation shape (from the spec)

| Current file | Direction A treatment |
|--------------|----------------------|
| `src/pages/Stats/StatsGrid.tsx` | Replaced by a single ruled **ledger sheet** — `LedgerSheet` + `LedgerRow` (label column \| body column), grouped under index tabs |
| `src/components/stats/StatCard.tsx` | Retired in favour of `LedgerRow` / `LedgerTile` |
| `src/components/stats/WritingStreak.tsx` | Kept, restyled as a ledger row (flame + Playfair + mono longest) |
| `src/components/stats/MoodDistribution.tsx` | Becomes a **ledger bar list** (swatch · name · bar · %), not a donut |
| `src/components/stats/WordCloud.tsx` | Becomes **ink-index chips** with visible mono counts, `onTagClick` preserved |
| `src/components/charts/*` | Recharts components kept, restyled to the ledger chart treatment (gold line, sage bars, direct peak labels) |
| `src/components/charts/HeatmapChart.tsx` | Kept; level colors + shared scroll container with the month ruler |
| `src/components/stats/StatNumber.tsx` | Kept (count-up already respects reduced motion) |

## Decisions log

- **2026-10-13** — Direction A chosen over B and C. Tabs ship as **static section labels** (no
  filtering) unless the user asks for behaviour. Chart library stays **recharts** (no new deps).
- **2026-10-13** — **Index tabs dropped.** The user reviewed the built page and asked for the tab
  bar (The Habit / The Feelings / The Rhythm / The Archive) to be removed so the page is a single
  continuous sheet. `LedgerTabs` was deleted along with the section/scroll machinery. This is a
  deliberate deviation from `ink-ledger/SKETCH.md` §2/§3, which still shows the tabs — the built
  single-page layout is authoritative.

> **Note:** `ink-ledger/SKETCH.md` predates this decision and still describes the tabbed variant.
> Read this file as the override wherever the two disagree.

## Open questions for the user

- Approve `accent-gold-deep` / `ledger-rule`, or use the fallbacks?
- Static tabs, or should the tabs actually filter/anchor-scroll the sheet?
