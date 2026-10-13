# Stats Page — Revamp Sketches

> **✅ DECIDED (2026-10-13): Direction A — The Archivist's Ledger is the winner** and is the
> approved build spec for `src/pages/Stats/`. See
> [`../pages/stats.md`](../pages/stats.md) for the decision record and implementation rules, and
> [`ink-ledger/SKETCH.md`](ink-ledger/SKETCH.md) for the full spec.
> B and C are kept below for reference and possible later reuse.

Three design directions for redesigning the **Stats page** (`src/pages/Stats/`), produced by
three designers working in parallel from the same design system.

- **Shared design system:** [`../MASTER.md`](../MASTER.md) (generated with ui-ux-pro-max; dials
  variance 7 / motion 5 / density 7)
- **Product:** DearDiary — an immersive digital diary styled as an old leather-bound book.
  Stack: React 18 + Vite + TypeScript + Tailwind + framer-motion + recharts + zustand.
- **Scope:** the 10 tiles of `src/pages/Stats/StatsGrid.tsx` (total entries, writing streak, top
  mood, total words, average per week, mood distribution, activity by hour, popular tags,
  favorites, writing activity heatmap). No file under `src/` was modified — these are sketches only.

> **Note on fonts:** the generated MASTER.md suggests Fira Code/Fira Sans, but the project already
> ships its own type system in `tailwind.config.js` — Playfair Display (display), Cormorant
> Garamond (sub), Inter (body), Caveat (hand), JetBrains Mono (mono). Every sketch below keeps the
> project's fonts; the project tokens win over the generated palette wherever they disagree.

## The three directions

| # | Direction | Sketch | Concept | Dials (variance/motion/density) |
|---|-----------|--------|---------|----------------------------------|
| A | The Archivist's Ledger | [`ink-ledger/SKETCH.md`](ink-ledger/SKETCH.md) · [mockup](ink-ledger/mockup.html) | Ruled paper, margin notes in a handwriting font, ink-stamp moods, tabbed chapter dividers — the ledger an archivist keeps beside the diary | 4 / 3 / 6 |
| B | Modern Bento | [`bento/SKETCH.md`](bento/SKETCH.md) · [mockup](bento/mockup.html) | True bento grid, one hero KPI, crisp serif numerals, soft-UI-evolution depth, refined charts with direct labels | 7 / 5 / 7 |
| C | A Year in Pages | [`story/SKETCH.md`](story/SKETCH.md) · [mockup](story/mockup.html) | Scroll-triggered storytelling in chapters with a bookmark progress ribbon — the diary writes back about your habits | 8 / 6 / 4 |

Each folder contains:

- `SKETCH.md` — the full build-ready spec: ASCII wireframes at 375/768/1440px, grid spec,
  token mapping (every value mapped to an existing project token), component specs for all 10
  tiles, motion, dark mode (`data-theme="night"`), and accessibility with contrast math
  (≥4.5:1 body, ≥3:1 large text).
- `mockup.html` — a self-contained static mockup with sample stats data. Open it directly in a
  browser (no build step); each has a light/night theme toggle.

## How to review

1. Open the three `mockup.html` files side by side in a browser and compare the feel of each.
2. Read each `SKETCH.md` and check the token-mapping tables — sketches that reuse existing
   tokens are cheaper to implement.
3. Pick a direction (or a mix, e.g. direction A's chapter tabbing + direction B's hero KPI) and
   the next step is a real implementation plan against `src/pages/Stats/`.
