# Calendar — Mood Heat Grid (Designer B)

> Design direction **B** for the DearDiary **Calendar page** (`src/pages/Calendar/`).
> Shared source of truth: [`design-system/deardiary-calendar/MASTER.md`](../../deardiary-calendar/MASTER.md)
> plus the project's own tokens in `tailwind.config.js` and `src/styles/theme.css`.
> Dials: **variance 7/10 · motion 5/10 · density 7/10**.
> Companion visual: [`mockup.html`](mockup.html) — open it directly in a browser.

---

## 1. Concept

**The month as an emotional map.** Instead of a grid of small mood dots, every day cell is *filled*
by mood, so a whole month reads as a **colour field** you can scan at a glance — your rough patches
(reds/oranges) and your good weeks (golds/greens) become visible shapes rather than lists.

Two channels carry the data:

- **Hue = mood.** Each day's fill is the colour of its *dominant* mood (the feeling the day lands on).
- **Heat = writing intensity.** The fill's strength is set by how many entries the day holds, in four
  steps. A single note is a pale wash; your biggest days are almost solid.

The selected day lifts out of the field with a crisp ring, a lift, and an enlarged date. The
day-detail panel becomes a **summary card** — a big date, the day's mood as a stamp, a one-line stat
readout — above the familiar entry list. It is the most analytical of the four directions (closer to a
premium habit tracker than a book), but it keeps the diary's warm cream-and-espresso palette, its
Playfair/Cormorant/Inter/JetBrains-Mono type, and its ink-stamp mood identity.

### The heat-intensity scale

Fill = `moodColor(dominantMood)` composited over the cell surface at a count-driven alpha.
"Alpha" is expressed as `color-mix(in srgb, <mood> N%, <surface>)`; the mockup uses the equivalent
`rgba()` so it needs no `color-mix` support.

| Level | Entries that day | Light alpha | Night alpha | Reads as |
|:-----:|:-----------------|:-----------:|:-----------:|----------|
| **0** | 0 | — (paper) | — (paper) | no writing; a blank day |
| **1** | 1 | 18 % | 24 % | a single note — a pale wash |
| **2** | 2 | 38 % | 46 % | a fuller day |
| **3** | 3 | 60 % | 68 % | a heavy day |
| **4** | 4+ | 85 % | 90 % | one of your biggest days — near-solid |

Night alphas are raised because the dark surface swallows light; the mood *bar* (below) always uses
full-saturation mood colours, which pop on both surfaces.

### How multiple moods on one day resolve

A day can hold several entries with different moods. Three rules keep it honest and lossless:

1. **Dominant mood (the hue).** `dominantMood = mode(moods)` — the mood that appears most often that
   day; ties break to the **first** entry's mood. This is a new derived value the grid computes and
   passes to the cell (the cell currently only receives `moods: Mood[]` + `count`). It is the single
   "where the day ended up" colour that makes the field scannable.
2. **Mood bar (the detail).** A 3 px stacked bar across the bottom of the cell shows **one segment per
   entry, in order, up to 4**; a 5th+ entry is shown as a `+n` overflow tick. This is the current
   "up to four mood dots" **re-expressed as a bar** — no per-day mood information is lost, it just
   reads as heat instead of a dot list.
3. **Count pill.** The entry count is always shown as a numeral in the cell's top-right, so intensity
   is legible even without colour (see §9).

---

## 2. ASCII wireframes

Heat fill is drawn with shade blocks: `·` level 0 · `░` L1 · `▒` L2 · `▓` L3 · `█` L4.
`◌` = today marker (gold dot) · `◉` = selected cell (ring + enlarged date) · faded = out-of-month.

### 375 px — single column (grid, then detail panel below)

```
┌───────────────────────────────────────────────┐
│ DearDiary  /  Calendar            (☾ Night)   │  top bar + theme toggle (fixed)
├───────────────────────────────────────────────┤
│  October 2026                                  │  month title · display 28px
│  25 days · mostly Happy      ‹  Today  ›       │  heat summary + nav
├───────────────────────────────────────────────┤
│ Intensity  · ░ ▒ ▓ █   1 → 4+ entries  (Less→More) │  intensity legend (always on)
│ ▸ Mood colors  [12 swatches ▾]                 │  mood key (collapsible, open in mockup)
├───────────────────────────────────────────────┤
│  SUN   MON   TUE   WED   THU   FRI   SAT       │  weekday row
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐   │
│  │fade │fade │fade │fade │░ 1 │▒ 2 │·    │   │  week 1  (Sep 27–30 faded)
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘   │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐   │
│  │·    │░ 1 │▓ 3 │░ 1 │▓ 3 │█ 4 │·    │   │  week 2  — a bright, busy week
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘   │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐   │
│  │░ 1 │▒ 2 │▒ 2 │▓ 3 │░ 1 │▓◉3 │░ 1 │   │  week 3  — rough patch 11–15,
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘   │            recovery on 16 (selected)
│        (◌ = today on Tue 13)                  │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐   │
│  │·    │▒ 2 │░ 1 │▓ 3 │░ 1 │░ 1 │·    │   │  week 4
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘   │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐   │
│  │·    │░ 1 │░ 1 │▒ 2 │▒ 2 │░ 1 │░ 1 │   │  week 5  (ends Sat Oct 31)
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘   │
├───────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────┐ │
│ │  Friday                    16             │ │  DAY DETAIL — summary card
│ │  ● Loved   ·  Warm and cherished          │ │  dominant mood stamp + label
│ │  3 entries   412 words   2 moods          │ │  stat row
│ │  ─────────────────────────────────────    │ │
│ │  ┌ mood ┐ date              ☆            │ │
│ │  │ A quieter kind of brave               │ │  EntryCard (list)
│ │  │ “We finally talked it through…”       │ │
│ │  │ 128 wds · 1 min · #growth #honest     │ │
│ │  └────────────────────────────────────   │ │
│ │  ┌ …second entry…                        │ │
│ │  ┌ …third entry…                         │ │
│ │  [   Write this day   ]                  │ │
│ └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

### 768 px — still single column (two-column starts at `lg` = 1024 px, matching the current page)

```
┌───────────────────────────────────────────────────────────────────────┐
│ DearDiary  /  Calendar                                  (☾ Night)     │
├───────────────────────────────────────────────────────────────────────┤
│  October 2026                                                          │
│  25 days · mostly Happy                    ‹  Today  ›                │
│  Intensity  · ░ ▒ ▓ █   1 → 4+ entries      ▸ Mood colors ▾           │
├───────────────────────────────────────────────────────────────────────┤
│  SUN   MON   TUE   WED   THU   FRI   SAT                               │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐   cells taller (~64px)   │
│  │fade │fade │fade │fade │░ 1 │▒ 2 │·    │                            │
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘                            │
│  … 6 week rows …                                                       │
├───────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────────────┐ │
│ │  Friday                          16        (summary card, full     │ │
│ │  ● Loved · Warm and cherished                  width, roomier)     │ │
│ │  3 entries   412 words   2 moods                                   │ │
│ │  [entry] [entry] [entry] [Write this day]                          │ │
│ └───────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

### 1440 px — two columns: heat grid + sticky detail panel

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ DearDiary  /  Calendar                                                (☾ Night)  │
├──────────────────────────────────────────────────────────────────────────────────┤
│   October 2026                                                                    │
│   25 days · mostly Happy                              ‹  Today  ›                │
│   Intensity  · ░ ▒ ▓ █   1 → 4+ entries            ▸ Mood colors ▾               │
├───────────────────────────────────────────────┬──────────────────────────────────┤
│  SUN  MON  TUE  WED  THU  FRI  SAT             │  Friday                16        │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐   │  ● Loved · Warm & cherished     │
│  │fade │fade │fade │fade │░ 1 │▒ 2 │·    │   │  3 entries  412 wds  2 moods    │
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘   │  ───────────────────────────    │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐   │  [EntryCard]                   │
│  │·    │░ 1 │▓ 3 │░ 1 │▓ 3 │█ 4 │·    │   │  [EntryCard]                   │
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘   │  [EntryCard]                   │
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐   │  [ Write this day ]            │
│  │░ 1 │▒ 2 │▒◌2 │▓ 3 │░ 1 │▓◉3 │░ 1 │   │  (sticky: top: 24px)            │
│  └────┘└────┘└────┘└────┘└────┘└────┘└────┘   │                                │
│  … weeks 4–5 …                            │  empty day → EmptyDiary +        │
│  grid ≈ 1fr  ·  panel = 22rem            │  “Nothing written yet”           │
└───────────────────────────────────────────────┴──────────────────────────────────┘
```

---

## 3. Grid spec

- **Columns:** fixed **7** (`grid-cols-7`), matching the existing grid. Weekday row uses the same
  7 columns and the same gap so headers align to cells.
- **Gap:** `sm` (8 px) on ≥768 px, `xs` (4 px) on mobile so 7 columns still fit without horizontal
  scroll.
- **Cell size / aspect:** `min-width: 44px; min-height: 44px` (touch target, §9) with
  `aspect-ratio: 1 / 1.05`. Effective width on mobile ≈ `(343 − 6×4) / 7 ≈ 45 px`; cells grow with
  the viewport (≈ 64 px at 768 px, ≈ 72 px at 1440 px). No horizontal scroll at any breakpoint.
- **Cell anatomy (top → bottom):** heat-fill layer (absolute, full cell) → top row
  `[date chip] …… [count pill]` → open heat in the middle → 3 px mood bar pinned to the bottom.
- **Heat scale:** see §1. Level is `Math.min(4, count)` for count ≥ 1; level 0 when count = 0.
- **Detail panel relation per breakpoint:**
  - **< 1024 px (`< lg`):** single column — grid on top, **detail panel below** (matches the current
    page's `lg:grid-cols-[1fr_22rem]` breakpoint, so behaviour is preserved). The panel is not sticky.
  - **≥ 1024 px (`≥ lg`):** two columns `grid-cols-[1fr_22rem]`; the panel is a right-hand column with
    `position: sticky; top: 24px` so it stays in view while the grid is the focus.
  - *Noted enhancement (optional):* the two-column split could be lowered to `md` (768 px) — at 768 px
    a 22 rem panel still leaves ≈ 48 px cells. Kept at `lg` to match current behaviour.

---

## 4. Token mapping

Every visual value maps to an **existing** project token. Fills are derived from `moodColor()` at an
alpha, so **no new colour token is required** (see "Tokens to add" below).

| # | Visual value | Light token | Night token | Contrast / note |
|---|--------------|-------------|-------------|-----------------|
| 1 | Page background | `primary-50` `#FAF6F0` | `primary-900` `#1A0F0A` | base surface |
| 2 | Card / detail-panel surface | `accent-cream` `#F5F0E6` | `primary-800` `#2A1A14` | 12.2 / 13.5 :1 vs its ink |
| 3 | Cell surface (level 0) | `accent-cream/60` over `primary-50` | `primary-800/60` | empty day |
| 4 | Cell heat fill L1–L4 | `color-mix(moodColor, accent-cream, 18/38/60/85%)` | `color-mix(moodColor, primary-900, 24/46/68/90%)` | **derived** — no new token |
| 5 | Body ink (titles, numerals) | `primary-700` `#3E2723` | `primary-100` `#F0E6D2` | 12.2 / 13.5 :1 |
| 6 | Secondary text | `primary-600` `#5D4037` | `primary-200` `#E0C9A6` | 8.2 / 10.4 :1 |
| 7 | Muted text (labels, meta) | `text-muted` `#7D5A3C` | `text-muted` `#C9A961` | 5.4 / 7.4 :1 |
| 8 | Date-chip + count-pill surface | `accent-cream` `#F5F0E6` | `primary-800` `#2A1A14` | opaque → text is fill-independent |
| 9 | Date-chip + count text | `primary-700` | `primary-100` | 12.2 / 13.5 :1 |
| 10 | Selected ring · focus ring · today dot | `accent-gold-deep` `#6F5220` | `accent-gold-deep` `#C9A961` | 6.4 / 7.4 :1 (theme-aware) |
| 11 | Hairline / cell border | `primary-200` `#E0C9A6` | `primary-600` `#5D4037` | structural |
| 12 | Mood-bar segments | `moodColor(mood)` (full sat.) | `moodColor(mood)` | decorative fills |
| 13 | Legend swatch edge | `primary-500` `#7D5A3C` | `primary-300` `#C9A961` | keeps swatch ≥3:1 boundary |
| 14 | Weekend column tint (optional) | `primary-50` over card | `primary-800/40` | decorative, non-text |
| 15 | Shadow soft / medium | `shadow-soft` / `shadow-medium` | night shadows | depth |
| 16 | Radius | `radius-md` (cell, chip) · `radius-lg` (card) | same | shape |
| 17 | Fonts | `display`/`sub`/`body`/`mono` | same | type |

**Why gold-deep for rings/dots (token 10):** plain `accent-gold` `#C9A961` is only **1.98 :1** on
cream — it fails the 3 :1 non-text threshold for a meaningful boundary. The project already ships a
theme-aware `accent-gold-deep` (`#6F5220` light → `#C9A961` night) that clears **6.4 :1 / 7.4 :1**.
Every gold "meaning" marker (selected ring, focus ring, today dot) uses it. Decorative gold (rules,
underlines, chart accents) may keep `accent-gold`.

**Tokens to add:** **none.** Heat fills derive from `moodColor()` at runtime; every surface, ink,
ring, border and shadow already exists. (If the team later wants a *named* ramp for reuse outside the
calendar, add `--heat-1..4` as four alpha constants — 0.18/0.38/0.60/0.85 light — but the calendar
needs no new hex.)

---

## 5. Component specs

All five pieces keep their current props/behaviour; additions are noted as **NEW**.

### 5.1 `CalendarHeader` — month toolbar

| State | Treatment |
|-------|-----------|
| Default | Left: month + year in `display` 700 (28→32 px), `primary-700`/`primary-100`, `aria-live="polite"`. Below it a **NEW** heat summary in `mono` 12 px `text-muted`: *"25 days · mostly Happy"*. Right: **Today** pill (`body` 12 px, `radius-md`, hover `primary-100/70`) + prev/next `IconButton`s (CaretLeft/CaretRight 16 px). |
| Hover | Today pill and both carets: background `primary-100/70` (night `primary-700/60`), 150 ms. |
| Focus | `focus-visible` 3 px `accent-gold-deep` outline, 3 px offset. |
| Disabled | Not used (nav is unbounded). |
| a11y | Carets keep `aria-label="Previous/Next month"`; month keeps `aria-live="polite"`; heat summary is decorative (`aria-hidden`) because the grid cells carry the data. |

### 5.2 `CalendarWeekdays` — weekday header row

| State | Treatment |
|-------|-----------|
| Default | 7 `role="columnheader"` cells, same grid+gap as cells. `body` 600 11 px, uppercase, `tracking-wide`, `text-muted` (5.4 :1). 3-letter label + `sr-only` full name (kept). **NEW (optional):** weekend columns (Sun/Sat) get a faint `primary-50` tint behind the whole column — a non-text cue, no colour-only meaning. |
| Hover/Focus | None — not interactive. |

### 5.3 `CalendarCell` — one day (the heat cell)

Props: current (`date`, `moods`, `count`, `isToday`, `isSelected`, `isCurrentMonth`, `onSelect`) plus
**NEW** `dominantMood: Mood`.

| State | Treatment |
|-------|-----------|
| Default (has entries) | Heat fill = `color-mix(moodColor(dominantMood), surface, alpha(level))`. Top-left **date chip**: opaque `accent-cream` (night `primary-800`), `radius-sm`, 1 px `primary-200` hairline, `mono` 600 12 px `primary-700`/`primary-100` numeral. Top-right **count pill**: opaque chip, `mono` 600 10 px, numeral = `count`. Bottom: 3 px **mood bar** — one segment per `mood` (≤4) in `moodColor`, `+n` overflow tick if `count>4`. |
| Default (empty, count 0) | Flat cell surface (`accent-cream/60`), no fill, no bar, no count pill. Date chip still present. |
| Hover | Non-out-of-month: fill `filter: brightness(1.05)` + `box-shadow: inset 0 0 0 1.5px accent-gold-deep/55`; 200 ms. **No transform** (dense grid → no neighbour overlap). |
| Focus | `:focus-visible` 3 px `accent-gold-deep` outline, 3 px offset (6.4 / 7.4 :1). |
| Selected | 2 px `accent-gold-deep` ring (box-shadow ring) + `transform: scale(1.04)` + `shadow-medium` + `z-index` lift, 250 ms `ease-out-expo`. Date-chip numeral enlarges 12→15 px. |
| Today | A 7 px `accent-gold-deep` dot sits immediately left of the numeral **inside the date chip** (the non-fill today marker). Selected+today = both markers (dot + ring). |
| Out-of-month | Whole cell `opacity: 0.32`, fill/bar/count hidden, date chip muted; still a valid focus/selection target (matches current, which keeps them selectable). |
| a11y | `role="gridcell"` wrapping a focusable element; `aria-pressed={isSelected}`; `aria-label` **NEW** = full date + dominant mood label + count, e.g. *"Friday, October 16 — Loved, 3 entries"* (+ "today"). See §9. |

### 5.4 `CalendarGrid` — month field

- Keeps `role="grid"` + `aria-label="Month grid"`; weekday row then 7-col `grid-cols-7` grid.
- **NEW:** computes `dominantMood` per day (`mode(moods)`, tie → first) and passes it down.
- **NEW:** proper ARIA rows — each week is a `role="row"` of 7 `gridcell`s (roving tabindex, §9).
- Month change (prev/next/today) animates the whole grid with `fade-slide` (opacity + translateY 8 px),
  250 ms. Moving the month also moves the selection into it (current behaviour, kept).

### 5.5 `CalendarDayDetail` — summary card + entries

| State | Treatment |
|-------|-----------|
| Summary header | Card (`accent-cream`, `primary-200` hairline, `radius-lg`, `shadow-soft`, `md/lg` padding). Left: weekday (`sub` italic 18 px muted) over a huge date numeral (`display` 800, clamp 44–64 px, `primary-700`/`primary-100`) + month/year (`body` 12 px muted). Right: **dominant-mood stamp** — 44 px circle in `moodColor(dominantMood)` with the mood's `MoodIcon` glyph in `accent-cream`, the mood label (`display` 700 20 px) and its description (`sub` italic muted). ≥3 distinct moods → stamp shows "Mixed" with the top 3 mood swatches. |
| Stat row (**NEW**) | 3 stats in `mono`/`display`: **Entries** (count), **Words** (Σ wordCount), **Moods** (distinct count). Value `display` 700 22 px; label `body` 600 10 px uppercase muted. Divider hairline above. |
| Has entries | `EntryCard layout="list"` list (unchanged): mood badge + relative date + favorite `Star`; title (`display` 600 18 px) + preview (`body` 14 px); footer (word count, read time, tags, location, Private lock). Then **Write this day** (`outline`). |
| Empty day | `EmptyDiary` illustration + "Nothing written yet" + **Write this day** (`gold`). Unchanged copy/illustration. |
| Write this day | Link to `${ROUTES.write}?date=…`; `gold` when empty, `outline` when it has entries (matches current). Always rendered. |

### Page-level empty state (no entries at all)

Unchanged: full-page `EmptyState` with `EmptyCalendar` illustration, "No days marked yet", and a
"Write an entry" gold link. The grid is not rendered in this state (current behaviour kept).

---

## 6. Typography, spacing, depth

**Type scale** (project fonts only):

| Role | Font / weight / size | Colour token |
|------|----------------------|--------------|
| Month title | `display` 700 · 28→32 px | ink |
| Heat summary | `mono` 500 · 12 px | muted |
| Weekday label | `body` 600 · 11 px · uppercase | muted |
| Cell date numeral | `mono` 600 · 12 px (15 px selected) | ink (on chip) |
| Cell count | `mono` 600 · 10 px | ink (on pill) |
| Detail weekday | `sub` italic 500 · 18 px | muted |
| Detail date numeral | `display` 800 · clamp 44–64 px | ink |
| Detail mood label | `display` 700 · 20 px | ink |
| Stat value / label | `display` 700 · 22 px / `body` 600 · 10 px | ink / muted |
| Entry title / preview | `display` 600 · 18 px / `body` 400 · 14 px | ink / `primary-500` |
| Legend / key labels | `body` 400 · 12 px | `primary-600` |

**Spacing scale** (`xs 4 · sm 8 · md 16 · lg 24 · xl 32`): page padding `md` (16) mobile → `xl` (32)
desktop; grid gap `xs`→`sm`; card padding `lg`; panel internal gap `md`; section gap `lg`; chip
padding 2–4 px; mood-bar height 3 px.

**Depth:** cells `shadow-soft` only when selected; detail card `shadow-soft`; hovered cell uses an
inset hairline (not a drop shadow) to avoid grid clutter; `shadow-medium` reserved for the selected
cell and the theme toggle. `shadow-hard` is unused (no modals here).

---

## 7. Motion (dial 5/10 — measured)

- **Durations:** 150 ms (hover/colour), 250 ms (selection, month fade, panel update), using
  `--ease-out-expo` `cubic-bezier(0.16,1,0.3,1)`. Nothing exceeds 300 ms.
- **Properties:** **transform and opacity only** for anything that moves — selected cell
  `scale(1.04)`; month/panel `fade-slide` = `opacity 0→1` + `translateY 8px→0`. Hover uses colour
  only (`brightness`, `box-shadow`, `background`) — no transform, so the dense grid never overlaps.
- **Stagger:** optional month-load stagger of ≤ 40 ms/cell from the top-left (transform+opacity), kept
  subtle; skipped entirely under reduced motion.
- **`prefers-reduced-motion: reduce`:** all transitions/animations off; selected cell renders at final
  state with **no** scale; month and panel changes are instant (no fade, no stagger). Colour/state
  changes still apply (they are not motion). Final readable state is always rendered.

---

## 8. Dark mode (`[data-theme="night"]`)

| Element | Night treatment |
|---------|-----------------|
| Page / card | `primary-900` `#1A0F0A` / `primary-800` `#2A1A14` |
| Ink / secondary / muted | `primary-100` `#F0E6D2` / `primary-200` `#E0C9A6` / `text-muted` `#C9A961` |
| Date chip + count pill | opaque `primary-800` with `primary-100` text (13.5 :1) |
| Heat fill | mood colour over `primary-900` at raised alphas (24/46/68/90 %) |
| Mood bar | full-saturation `moodColor` (pops on dark) |
| Ring / focus / today dot | `accent-gold-deep` → `#C9A961` (7.4 :1) |
| Hairline / border | `primary-600` `#5D4037` |
| Shadows | night `--shadow-*` (deeper black) |
| Toggle | same fixed pill; label/icon swap (☾/☀), `localStorage` persists |

All night values reuse existing `theme.css` variables / tokens — no new night hexes.

---

## 9. Accessibility

### Contrast (real math, WCAG 2.1)

Method: `L = 0.2126R + 0.7152G + 0.0722B` on linearised sRGB; ratio `= (L₁+0.05)/(L₂+0.05)`.
Surfaces: cream `#F5F0E6` **L = 0.8746**; night card `#2A1A14` **L = 0.0128**.

**Light (on `accent-cream`):**

| Colour | Hex | Ratio | Use |
|--------|-----|:-----:|-----|
| `primary-700` ink | `#3E2723` | **12.2 :1** | body/titles (AAA) |
| `primary-600` | `#5D4037` | **8.2 :1** | secondary (AAA) |
| `text-muted` | `#7D5A3C` | **5.4 :1** | labels/meta (AA) |
| `accent-gold-deep` | `#6F5220` | **6.4 :1** | rings/focus/today (AA, ≥3 :1 UI) |
| `primary-400` | `#A67C52` | **3.3 :1** | large text / icons only — never body |

**Night (on `primary-800`):**

| Colour | Hex | Ratio | Use |
|--------|-----|:-----:|-----|
| `primary-100` | `#F0E6D2` | **13.5 :1** | body/titles (AAA) |
| `primary-200` | `#E0C9A6` | **10.4 :1** | secondary (AAA) |
| `text-muted` | `#C9A961` | **7.4 :1** | labels/meta (AA/AAA) |
| `accent-gold-deep` | `#C9A961` | **7.4 :1** | rings/focus/today (AA) |

**The date/count guarantee (why colour alone can never fail here).** The date numeral and count sit
on an **opaque chip** (`accent-cream` / `primary-800`) that is *independent of the heat fill behind
it*. So every cell — regardless of which of the 12 mood hues or which heat level fills it — keeps the
same **12.2 :1 (light) / 13.5 :1 (night)** text contrast. The chip's own 1 px `primary-200`
(night `primary-600`) hairline keeps it visible even on the palest L1 wash. This is the deliberate
fix for the failure mode of tinted-cell calendars: e.g. `sad #5C6BC0` as a *full-saturation* fill
gives only 4.28 :1 (cream text) / 2.84 :1 (ink text) — both below AA for small text — so the text is
never placed on the raw fill.

### "Never colour alone" — the non-colour channels

Colour carries the mood/intensity, so every encoded value is also available without colour:

1. **Date numeral** — always present in every cell (the day's identity).
2. **Count pill** — the entry count as a numeral (intensity, legible without the fill).
3. **Mood bar segments** — per-entry mood, and the count = number of segments.
4. **`aria-label`** on each cell — full date + dominant mood *name* + count + "today", e.g.
   *"Friday, October 16 — Loved, 3 entries"*. Screen-reader users get the mood as text, not colour.
5. **Legend** — the intensity legend is labelled **"1 → 4+ entries / Less → More"** in text, and the
   mood key pairs every swatch with its **mood name** (e.g. "Loved") and, on the detail stamp, its
   description ("Warm and cherished"). No legend item is a bare colour.

**Legend/key WCAG-safety:** swatches are decorative fills; each is bounded by a 1 px `primary-500`
(night `primary-300`) edge so the swatch meets the 3 :1 non-text rule against the card, and every
swatch is accompanied by a text label at `primary-600` (8.2 :1) — so the legend's meaning never rests
on colour perception.

### Keyboard navigation (grid of buttons → ARIA grid pattern)

- The grid is `role="grid"`; each week is `role="row"`; each cell is a `role="gridcell"` containing one
  focusable `<button>` (the day).
- **Roving tabindex:** exactly one cell has `tabindex="0"` (the selected day); all others `-1`. Tab
  enters/leaves the grid as a single stop.
- **Arrow keys** move the roving focus *and* select: `←/→` = ±1 day, `↑/↓` = ±7 days (one week),
  `Home/End` = first/last day of the week, `PageUp/PageDown` = ±1 month (updates the month + selection,
  matching the nav). `Enter/Space` activates the focused day.
- Focus wraps at month edges into the prev/next month exactly as the arrows imply (consistent with the
  current "moving the month moves the selection" behaviour).
- **Focus-visible:** 3 px `accent-gold-deep` outline, 3 px offset — visible on every cell and control
  in both themes (6.4 / 7.4 :1). Focus is never removed, only restyled.
- **Touch targets:** every cell is ≥ **44 × 44 px** (`min-width/min-height: 44px`, `aspect-ratio
  1/1.05`); the Today pill and carets are ≥ 44 px tall; the theme toggle is ≥ 44 px.

### Other

- Cell `aria-label` includes "today" when applicable; the month `<h2>` keeps `aria-live="polite"`.
- Out-of-month cells remain in the DOM and focusable (preserves current behaviour); they are
  visually faded, not hidden.
- `prefers-reduced-motion` honoured (§7); `prefers-contrast` benefits from the opaque-chip text
  guarantee above.

---

## 10. What this improves, and the tradeoffs

**Improves vs the current page**

1. **Scannability.** A month becomes one colour field — rough patches and good weeks are visible as
   shapes, not something you assemble dot-by-dot. This is the core win.
2. **Intensity is now visible.** The current dots show *which* moods but not *how much* you wrote; the
   heat level surfaces day weight at a glance.
3. **Stronger day summary.** The detail panel leads with a big date, a mood stamp and a stat readout
   (entries/words/moods) before the entry list — the current panel jumps straight to entries.
4. **Accessibility uplift.** Text moves onto opaque chips (fill-independent contrast); gold meaning
   markers move to the theme-aware `accent-gold-deep` (fixes the 1.98 :1 gold-on-cream ring); the cell
   `aria-label` gains the dominant mood; the grid gets a proper roving-tabindex keyboard model.
5. **Legend.** An explicit intensity + mood key teaches the encoding instead of leaving dots
   unexplained.

**Risks / tradeoffs**

1. **Mid-tone hues are muted, not solid.** To keep text legible and the field calm, fills are *tints*
   (≤ 85 %), never full-saturation mood colour. Vivid single days read softer than a raw dot would —
   the mood bar (full saturation) is the vivid accent that compensates.
2. **"Dominant mood" hides variety in the hue.** A mixed day shows one hue; the per-entry moods live
   only in the bar + aria-label + detail panel. Acceptable for the glance-level goal, but the hue is a
   summary, not the full truth (documented in §1).
3. **Density.** Date chip + count pill + mood bar + heat in a ~45 px cell is the densest of the four
   directions; on very small screens the count pill is the first thing to drop (the mood-bar segment
   count and the aria-label still carry it). The two-column split stays at `lg` to match the current
   page rather than claiming tablet width early.
