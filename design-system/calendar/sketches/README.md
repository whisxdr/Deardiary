# Calendar Page â€” Revamp Sketches

Four design directions for redesigning the **Calendar page** (`src/pages/Calendar/`), produced by
four designers working in parallel from the same design system.

- **Shared design system:** [`../deardiary-calendar/MASTER.md`](../deardiary-calendar/MASTER.md) (generated with ui-ux-pro-max; dials
  variance 6 / motion 5 / density 7)
- **Product:** DearDiary â€” an immersive digital diary styled as an old leather-bound book.
  Stack: React 18 + Vite + TypeScript + Tailwind + framer-motion + recharts + zustand.
- **Scope:** the five pieces of `src/components/calendar/` â€” `CalendarHeader` (month label +
  prev/next/today), `CalendarWeekdays` (weekday row), `CalendarGrid` (7-column month grid),
  `CalendarCell` (one day: date numeral, mood dots, entry count, today/selected/out-of-month
  states), and `CalendarDayDetail` (side panel of the selected day's entries).

> **Note on fonts:** the generated MASTER.md suggests Kalam/Patrick Hand (handwriting faces), but
> the project ships its own type system in `tailwind.config.js` â€” Playfair Display (display),
> Cormorant Garamond (sub), Inter (body), Caveat (hand), JetBrains Mono (mono). Every sketch keeps
> the project's fonts. The stats page also taught us a legibility lesson that applies here:
> decorative faces must not be used for repeated small text, and small text needs â‰¥4.5:1.

## The four directions

| # | Direction | Sketch | Concept | Dials (variance/motion/density) |
|---|-----------|--------|---------|----------------------------------|
| A | Almanac Pages | [`almanac/SKETCH.md`](almanac/SKETCH.md) Â· [mockup](almanac/mockup.html) | A page from an old farmer's almanac â€” engraved month heading, small-caps weekday initials, ruled day boxes, a marginalia gutter | 5 / 4 / 6 |
| B | Mood Heat Grid | [`heat-grid/SKETCH.md`](heat-grid/SKETCH.md) Â· [mockup](heat-grid/mockup.html) | Day cells filled by mood intensity, so a month reads as a scannable colour field â€” the most analytical take | 7 / 5 / 7 |
| C | Torn Paper Wall | [`torn-paper/SKETCH.md`](torn-paper/SKETCH.md) Â· [mockup](torn-paper/mockup.html) | A corkboard of torn-out diary scraps, rotated and pinned; empty days as faint ruled squares | 9 / 6 / 5 |
| D | Diary Timeline | [`timeline/SKETCH.md`](timeline/SKETCH.md) Â· [mockup](timeline/mockup.html) | Drop the grid for a continuous vertical spine of the month â€” reads like flipping through pages | 7 / 6 / 4 |

Each folder contains:

- `SKETCH.md` â€” the full build-ready spec: ASCII wireframes at 375/768/1440px, grid/layout spec,
  token mapping (every value mapped to an existing project token), component specs for all five
  pieces including every state, motion, dark mode, and accessibility with contrast math
  (â‰¥4.5:1 body, â‰¥3:1 large text).
- `mockup.html` â€” a self-contained static mockup with a realistic month of sample entries. Open it
  directly in a browser (no build step); each has a light/night theme toggle.

## How to review

1. Open the four `mockup.html` files and compare the feel of each â€” note which one makes finding a
   day fastest.
2. Read each `SKETCH.md`, paying attention to what each direction *costs*: B leans on colour
   (check its non-colour channel), C leans on decoration (check its legibility caps), and D gives
   up month-at-a-glance scanning (check how it compensates).
3. Pick a direction and the next step is a real implementation plan against
   `src/components/calendar/`.
