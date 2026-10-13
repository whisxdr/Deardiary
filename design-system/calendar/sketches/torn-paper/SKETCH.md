# Torn Paper Wall — DearDiary Calendar Sketch

> **Designer C** · Direction: *Torn Paper Wall* · Dials: variance 9/10 · motion 6/10 · density 5/10
> Companion mockup: [`mockup.html`](./mockup.html) (self-contained, light/night toggle)
> Status: build-ready spec. Every visual value maps to an **existing** project token unless a new token is explicitly proposed below.

---

## 1. Concept

**"A corkboard of torn-out diary pages."**

The other directions keep the calendar a calendar. This one asks what the calendar would be if the
user physically tore each written day out of the diary and pinned it to a board. So:

- The page background becomes **corkboard** (`primary-100`, warmer and darker than the app's paper)
  rather than paper — the thing the scraps are pinned *to*.
- A day with an entry is a **scrap of paper**: `accent-cream`, a soft drop shadow, a faint ruled
  line down it (the diary's own ruled paper), and a **small deterministic rotation** so the wall
  looks pinned by hand rather than machine-placed.
- A day with nothing is a **dashed ruled square** drawn on the board itself — the outline of a page
  that has not been torn out yet.
- The month header and the day detail are both **pinned cards** with a **torn deckled edge** (a CSS
  `pattern` of an irregular polyline) and a **thumbtack** at the top.
- Selecting a scrap **lifts it**: bigger shadow, slight scale, and a gold ring — the scrap comes
  forward off the board.
- Interaction leans on rotation and lift: nav buttons and the write button tilt on hover, the
  favourite star spins slightly when toggled.

The result is tactile and expressive — the most physical of the four directions, and the furthest
from a data grid.

---

## 2. What carries over from the current page

All of it. The scrap metaphor is applied *on top of* the existing 7-column month grid; nothing about
the date logic changes.

| Current piece | Torn Paper treatment |
|---------------|----------------------|
| `CalendarHeader` | A **pinned header card** with a torn edge and a thumbtack; month label + prev/next/today |
| `CalendarWeekdays` | A **plain small-caps strip** on the cork — deliberately undecorated, so the scraps carry the texture |
| `CalendarGrid` | The **wall** — same `repeat(7, 1fr)` grid; each cell is a slot holding either a scrap or a dashed ghost |
| `CalendarCell` | A **scrap** (pinned, has entries) or a **ghost** (dashed, empty). All existing props preserved |
| `CalendarDayDetail` | A **pinned detail card** with torn edge + thumbtack, the day's entries and Write-this-day |

Newly surfaced: the board ground, the torn edges, the pins, the rotation, and a Caveat note naming
each written day.

---

## 3. ASCII wireframes

### 3.1 Mobile — 375px (scraps shrink, tilt reduced, ghosts stay dashed)

```
┌──────────────────────────────────┐
│ DearDiary / Calendar      (☾)    │
├──────────────────────────────────┤
│        ⏭ (thumbtack)             │
│  ┌────────────────────────────┐  │
│  │THE WALL OF DAYS            │  │
│  │October 2026        [Today][‹][›]│  ← pinned header card
│  │every day you wrote,        │  │
│  │torn out and pinned         │  │
│  └────────────────────────────┘  │
│  ～～ torn deckled edge ～～       │
├──────────────────────────────────┤
│ SUN MON TUE WED THU FRI  SAT     │  ← plain strip on cork
├──────────────────────────────────┤
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐
│ │ 27 ││ 28 ││ 29 ││ 30 ││▗1▖ ││ 2  ││▗3▖ │
│ │    ││    ││    ││    ││ •  ││    ││ •  │
│ │    ││    ││    ││    ││1 en││    ││1 en│
│ └────┘└────┘└────┘└────┘└────┘└────┘└────┘
│   ⋮ five more weeks               │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐
│ │ 11 ││▗12▖││ 13 ││ 14 ││▗15▖││ 16 ││ 17 │
│ │ •• ││ •  ││TODAY││    ││ •  ││    ││    │
│ │2 en││1 en││ •  ││    ││1 en││    ││    │
│ └────┘└────┘└────┘└────┘└────┘└────┘└────┘
│   ⋮                               │
├──────────────────────────────────┤
│      ⏭                           │
│  ┌────────────────────────────┐  │  ← pinned detail card
│  │PINNED HERE                 │  │
│  │Tuesday, October 13         │  │
│  │1 entry · 214 words         │  │
│  │- - - - - - - - - - - - - - │  │
│  │the page you will remember  │  │  ← Caveat
│  │Something finally clicked   │  │
│  │● Mind-blown        ★      │  │
│  │Stared at the problem…      │  │
│  │214 words · 1 min · 09:35   │  │
│  │[ + Write this day ]        │  │
│  └────────────────────────────┘  │
│  ～～ torn edge ～～               │
├──────────────────────────────────┤
│ * every scrap torn from the       │
│   entries kept in this browser.   │
└──────────────────────────────────┘
```

### 3.2 Tablet — 768px (full tilt range, roomier scraps)

```
┌────────────────────────────────────────────────────────────┐
│                    ⏭                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ THE WALL OF DAYS              [Today][‹][›]          │  │
│  │ October 2026                                         │  │
│  │ every day you wrote, torn out and pinned             │  │
│  └──────────────────────────────────────────────────────┘  │
│   ～～ torn edge ～～                                        │
├────────────────────────────────────────────────────────────┤
│  SUN   MON   TUE   WED   THU   FRI    SAT                  │
├────────────────────────────────────────────────────────────┤
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐                 │
│ │ 27 ││ 28 ││ 29 ││ 30 ││ 1  ││ 2  ││ 3  │                 │
│ │    ││    ││    ││    ││ •  ││    ││ •  │                 │
│ │    ││    ││    ││    ││1 en││    ││1 en│                 │
│ │    ││    ││    ││    ││first││    ││the │                 │
│ │    ││    ││    ││    ││light││    ││long│                 │
│ └────┘└────┘└────┘└────┘└────┘└────┘└────┘                 │
│   ⋮ six weeks                                              │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐                 │
│ │ 11 ││ 12 ││[13]││ 14 ││ 15 ││ 16 ││ 17 │                 │
│ │ •• ││ •  ││TODAY││    ││ •  ││    ││    │                 │
│ │2 en││1 en││ •  ││    ││1 en││    ││    │                 │
│ │two ││run ││1 en││    ││rain││    ││    │                 │
│ └────┘└────┘└────┘└────┘└────┘└────┘└────┘                 │
├────────────────────────────────────────────────────────────┤
│                    ⏭                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PINNED HERE · Tuesday, October 13 · 1 entry · 214 w  │  │
│  │ - - - - - - - - - - - - - - - - - - - - - - - - - -  │  │
│  │ Something finally clicked      ● Mind-blown      ★  │  │
│  │ Stared at the problem for a week and then it simply  │  │
│  │ opened. Wrote it down before it could close again.   │  │
│  │ 214 words · 1 min · 09:35 · #work                    │  │
│  │ [ + Write this day ]                                │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 3.3 Desktop — 1440px (full wall, generous scraps)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                                    ⏭                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ THE WALL OF DAYS                                    [Today][‹][›]        │  │
│  │ October 2026                                                             │  │
│  │ every day you wrote, torn out and pinned                                 │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│   ～～～～～ torn deckled edge ～～～～～                                          │
├────────────────────────────────────────────────────────────────────────────────┤
│    SUN      MON      TUE      WED      THU       Fri        Sat                 │
├────────────────────────────────────────────────────────────────────────────────┤
│ ┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐               │
│ │  27   ││  28   ││  29   ││  30   ││   1   ││   2   ││   3   │               │
│ │       ││       ││       ││       ││   •   ││       ││   •   │               │
│ │       ││       ││       ││       ││1 entry││       ││1 entry│               │
│ └───────┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘               │
│   ⋮ six weeks                                                                   │
│ ┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐               │
│ │  11   ││  12   ││ [13]  ││  14   ││  15   ││  16   ││  17   │               │
│ │  • •  ││   •   ││ TODAY ││       ││   •   ││       ││       │               │
│ │2 entry││1 entry││   •   ││       ││1 entry││       ││       │               │
│ │ two   ││running││1 entry││       │ rain  ││       ││       │               │
│ │ pages ││  low  ││this   ││       │ again ││       ││       │               │
│ └───────┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘               │
│   ⋮                                                                             │
│ ┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐               │
│ │  25   ││  26   ││  27   ││  28   ││  29   ││  30   ││  31   │               │
│ │   •   ││   •   ││       ││   •   ││       ││   •   ││   •   │               │
│ │1 entry││1 entry││       ││1 entry││       ││1 entry││1 entry│               │
│ │ the   ││ plans ││       ││turning││       │ a     ││ last  │               │
│ │market ││       ││       ││ over  ││       │steady ││ page  │               │
│ └───────┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘               │
├────────────────────────────────────────────────────────────────────────────────┤
│                                    ⏭                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ PINNED HERE                                                              │  │
│  │ Tuesday, October 13 · 1 entry · 214 words                                │  │
│  │ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  │  │
│  │ the page you will remember this month for                                │  │
│  │                                                                          │  │
│  │ Something finally clicked            ● Mind-blown                   ★    │  │
│  │ Stared at the problem for a week and then it simply opened. Wrote it    │  │
│  │ down before it could close again.                                        │  │
│  │ 214 words · 1 min · 09:35 · #work                                        │  │
│  │ [ + Write this day ]                                                     │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│   ～～～～～ torn edge ～～～～～                                                  │
├────────────────────────────────────────────────────────────────────────────────┤
│ * every scrap torn from the entries kept in this browser.                       │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Layout spec

```
Wall: display grid; grid-template-columns: repeat(7, 1fr); gap: 6px (4px below 900px).
  Each cell is a .slot (a <button>, transparent, min-height 96px desktop / 78px mobile) that
  centres either a .scrap or a .ghost. The slot is the interactive + focusable element; the
  scrap/ghost is its visual, so the tilt lives on the slot and never breaks the grid cell box.

.scrap: width 100%, min-height 92px, background var(--scrap), border-radius 2px 3px 2px 4px
  (deliberately uneven — a torn corner), box-shadow var(--shadow-scrap).
  A ::after overlay draws faint ruled lines (repeating-linear-gradient, 15px pitch, 10% ink)
  so the scrap carries the diary's own paper ruling.

.ghost: width 100%, min-height 92px, border 1px dashed var(--border), border-radius 3px,
  background rgba(255,255,255,0.04) — the outline of a page not yet torn out.

Rotation: pinned slots get --tilt = deterministic ±1.6deg, derived from the day number so the
  wall is stable across renders (no jitter on re-render). 1.6deg is the hard cap: past ~2deg the
  date numeral stops reading as upright and the eye starts working.

No overlap: rotation is applied to the slot, and the slot's grid box is unchanged, so a rotated
  scrap can never escape its cell or collide with a neighbour. The 6px gap absorbs the ~3px of
  horizontal overhang a 1.6deg tilt creates on a 96px card.

Pinned cards (header + detail): transform rotate(-0.5deg) / rotate(-0.6deg), a torn top and
  bottom edge (pattern fill, 9px tall), and an 18px thumbtack centred on the top edge.

Container: max-width 1200px; side padding 28px desktop / 14px mobile.
```

> **Implementation note:** the torn edge is a single reusable SVG `<pattern>` (`#tornEdge`) of an
> irregular polyline, referenced by `.torn-top` / `.torn-bottom` via `fill: currentColor` so it
> inherits each card's colour. The bottom edge is `scaleY(-1)` so the tear runs the other way.

---

## 5. Token mapping

Every value is an **existing** project token. Raw hex appears in the mockup's `:root` only as the
concrete stand-in.

| Visual role | Token / value | Where used |
|-------------|---------------|------------|
| Board (page) | `bg-primary-100` `#F0E6D2` | `<body>` — the cork the scraps sit on |
| Board shade | `primary-100` radial washes | `body` background-image |
| Board (night) | `primary-900` `#1A0F0A` over `#241109` | `[data-theme='night']` |
| Scrap surface | `bg-accent-cream` `#F5F0E6` | `.scrap`, pinned cards |
| Scrap (night) | `primary-800` `#2A1A14` | `[data-theme='night']` |
| Scrap ruling | `primary-500/10` repeating gradient | `.scrap::after` |
| Scrap shadow | `shadow-medium` `0 4px 16px rgba(62,39,35,.12)` | `.scrap` |
| Lifted shadow | `shadow-hard` `0 8px 32px rgba(62,39,35,.20)` | hover / selected |
| Night shadow | `rgba(0,0,0,.5/.65)` | `[data-theme='night']` |
| Ghost border | `border-primary-200` `#E0C9A6`, dashed | `.ghost` |
| Ghost border (night) | `border-primary-600` `#5D4037` | night `.ghost` |
| Date numeral | `text-primary-700` `#3E2723` | `.dnum` (12.17:1) |
| Ghost date numeral | `text-primary-400` `#A67C52` | `.slot.blank .dnum` — an empty day is deliberately quieter (3.29:1, large-ish italic 17px) |
| Entry title | `text-primary-700` `#3E2723` | detail `.entry-title` |
| Body / preview | `text-primary-600` `#5D4037` | `.entry-preview` (8.20:1) |
| Kicker / meta / count | `text-primary-500` `#7D5A3C` | `.kick`, `.detail-meta`, `.dcount` (5.44:1) |
| Caveat note | `text-primary-500` `#7D5A3C` | `.scrap-note`, `.detail-note` |
| Today ring | `ring-accent-gold` (2px) | `.slot.is-today` |
| Selected ring | `ring-accent-gold` (3px) + lift | `.slot[aria-pressed=true]` |
| Today numeral | `text-accent-gold-deep` `#6F5220` (night → `#C9A961`) | `.is-today .dnum` |
| Thumbtack | radial gradient `accent-rose` `#B76E79` → `#8E4A55` | `.pin` |
| Torn edge | `currentColor` on the card surface | `.torn-top` / `.torn-bottom` |
| Write button | `bg-accent-gold-deep` + `text-primary-50` | `.write-btn` |
| Nav hover | `border-accent-gold` + `shadow-medium` + tilt | `.nav-btn:hover` |
| Mood dots | `moodColor(mood)` from `src/constants/moods.ts` | `.dot`, mood tag |
| Focus ring | `outline: 3px solid var(--gold)` + `outline-offset: 3px` | every interactive |
| Display font | `font-display` (Playfair Display) | month title, date numerals, entry titles |
| Serif italic | `font-sub` (Cormorant Garamond) | detail meta, previews |
| Body | `font-body` (Inter) | kickers, weekday strip, buttons |
| Mono | `font-mono` (JetBrains Mono) | counts, word/time footers |
| Hand | `font-hand` (Caveat) | scrap notes, detail gloss, footnote |
| Radius | `rounded-sm` 3–4px (uneven on scraps) / `rounded-lg` 10px cards | wall / pinned cards |
| Motion | `duration-fast` 150–250ms, `ease-out-expo` | all transforms |

**No new tokens are required.** `accent-gold-deep` and `ledger-rule` already exist from the stats
work (this direction uses `gold-deep` but not the ledger rule).

---

## 6. Component-by-component spec (all five pieces)

### 6.1 Pinned header card (replaces `CalendarHeader`)
- **Shows:** month + year, prev/next/today. Same `monthFormatter` value, set in Playfair.
- **Structure:** a `accent-cream` card with a torn top/bottom edge, a thumbtack, kicker, `<h1>`,
  and an italic sub-line. `transform: rotate(-0.5deg)`.
- **Nav:** Today (small-caps pill, 44px) + prev/next (44×44 round icon buttons). Hover = lift +
  tilt (`translateY(-2px) rotate(-3deg)`) + gold border + scrap shadow.
- **States:** hover/focus as above; `:focus-visible` = 3px gold outline offset 2.
- **A11y:** month label keeps `aria-live="polite"`.

### 6.2 Weekday strip (replaces `CalendarWeekdays`)
- **Shows:** Sun–Sat, 11px/700 uppercase `letter-spacing: 0.14em`, `text-primary-500`.
- **Deliberately plain** — no borders, no background — so the cork reads through and the scraps
  carry all the texture. Weekend days in italic without uppercase.
- **A11y:** `aria-hidden="true"`; each cell's `aria-label` already names the weekday.

### 6.3 The wall (replaces `CalendarGrid`)
- **Shows:** unchanged logic — `startOfWeek`/`endOfWeek`, offset cells, `byDay`.
- **Structure:** `repeat(7, 1fr)`, gap 6px. Each cell is a transparent `.slot` button.
- **A11y:** `role="grid"` on the wall; each slot is `role="gridcell"`.

### 6.4 Scrap / ghost (replaces `CalendarCell`)
- **Shows:** all existing props preserved (`date`, `moods`, `count`, `isToday`, `isSelected`,
  `isCurrentMonth`, `onSelect`), plus the Caveat note.
- **Scrap (count > 0):** cream surface, torn corner radii, ruled-line overlay, soft shadow,
  `--tilt` rotation. Playfair date `20px/700`, today pill, mood dots (7px, first 4), mono count,
  Caveat note.
- **Ghost (count === 0):** a dashed 1px border on the cork, date numeral in `primary-400` italic,
  no dots, no count. Reads as the outline of a page not yet torn out.
- **States:**
  - `isToday` → scrap/ghost gains `box-shadow: …, 0 0 0 2px var(--gold)` and the numeral turns
    `accent-gold-deep`; a "Today" pill appears.
  - `isSelected` (`aria-pressed="true"`) → the scrap **lifts**: `shadow-hard` + `0 0 0 3px var(--gold)`
    + `translateY(-4px) rotate(-1.5deg) scale(1.03)` on hover, and the lifted ring at rest.
  - `!isCurrentMonth` → `opacity: 0.40`, no tilt (offset cells stay flat and quiet).
  - hover → lift + slight extra counter-rotation.
- **A11y:** `aria-label` = `"October 13, 1 entry, mood Mind-blown, today"`. `aria-pressed` for
  selection. `:focus-visible` puts a 3px gold outline on the inner scrap/ghost with `offset: 3px`,
  so the ring is never clipped by the rotated card.
- **Touch target:** slot min-height 96px (78px mobile) — well over 44px.

### 6.5 Pinned detail card (replaces `CalendarDayDetail`)
- **Shows:** long date, entry/word count, entries with favourite toggles, Write-this-day.
- **Structure:** same pinned-card treatment as the header (torn edges, thumbtack, `rotate(-0.6deg)`),
  kicker → `<h2>` Playfair `27px` → italic meta → **dashed rule** → Caveat gloss → entries →
  actions.
- **Entries:** title (Playfair 18px) · mood tag (dot + label) · preview (Cormorant 17px/1.5) ·
  footer (mono words/reading/time/tags) · favourite (44×44 round, gold when pressed, spins
  `-6deg scale(1.08)` on toggle).
- **Write this day:** gold-deep primary in the empty branch, outline in the populated branch —
  both preserved from the current component.
- **Empty branch:** keeps `EmptyDiary` + "Nothing written yet" + the gold Write-this-day.

---

## 7. Typography, spacing, depth

### Typography scale
| Role | Font | Size / weight | Colour |
|------|------|---------------|--------|
| Kicker | `font-body` | 10px / 700, tracking 0.2em, uppercase | `text-primary-500` |
| Month title | `font-display` | 32–44px / 700, tracking −0.5px | `text-primary-800` |
| Year | `font-display` | same, italic / 500 | `text-primary-500` |
| Sub-line | `font-sub` | 16px, italic | `text-primary-500` |
| Weekday strip | `font-body` | 11px / 700, tracking 0.14em, uppercase | `text-primary-500` |
| Scrap date | `font-display` | 20px / 700 | `text-primary-700` |
| Ghost date | `font-display` | 17px / 500, italic | `text-primary-400` |
| Today pill | `font-body` | 9px / 700, uppercase | `text-primary-500` |
| Entry count | `font-mono` | 10px | `text-primary-500` |
| Scrap note | `font-hand` | 15px / 600 | `text-primary-500` |
| Detail date | `font-display` | 27px / 700 | `text-primary-800` |
| Detail gloss | `font-hand` | 20px / 600 | `text-primary-600` |
| Entry title | `font-display` | 18px / 600 | `text-primary-700` |
| Entry preview | `font-sub` | 17px / 400, line-height 1.5 | `text-primary-600` |
| Entry footer | `font-mono` | 11px | `text-primary-500` |
| Footnote | `font-hand` | 20px | `text-primary-500` |

### Spacing
`xs 4` (dot gaps) · `sm 8` (card padding, strip) · `md 16` (detail internal) · `lg 24` (wall↔detail) ·
wall gap `6px` (4px below 900px) · scrap/ghost `min-height 92px` inside a `96px` slot ·
card padding `22–28px`. Density 5/10 — the wall is airy enough that the scraps can breathe.

### Depth
The whole point. Two levels: `shadow-medium` for a scrap at rest, `shadow-hard` when it is lifted
(hover or selected). The corkboard ground is flat, so depth reads as *height off the board*.

---

## 8. Motion spec (motion 6/10 — expressive but capped)

- **Durations:** `--duration-fast` 150ms for border/colour; `--duration-normal` 250ms for every
  transform and shadow.
- **Easing:** `ease-out-expo` `cubic-bezier(.16,1,.3,1)`.
- **Properties:** **transform + box-shadow + border-color + background only.** Never width/height.
- **Hover:** scrap lifts `translateY(-4px) rotate(-1.5deg) scale(1.03)` + `shadow-hard`; nav and
  write buttons lift and tilt; the favourite star spins `-6deg scale(1.08)`.
- **Selected:** the scrap takes its lifted shadow + 3px gold ring at rest, so selection persists
  visually after the pointer leaves.
- **Month change:** optional single `fade-slide` 250ms on the wall. Off under reduced motion.
- **`prefers-reduced-motion: reduce` (mandatory):**
  - **All rotations are removed** (`.slot.pinned`, `.head-card`, `.detail-card` → `transform: none`),
    so the wall renders as a clean grid of upright cards. This is the important one: rotation is
    the direction's signature and it is the first thing to go.
  - All transitions disabled; hover/selected reduce to colour and ring only.
  - The month-change fade renders the final state immediately.
- **Pause when hidden:** no ambient or looping animation exists here, so there is nothing to pause;
  every animation is pointer- or month-change-triggered and completes in ≤250ms.

---

## 9. Dark mode (`data-theme="night"`)

| Role | Light | Night |
|------|-------|-------|
| Board | `#F0E6D2` primary-100 | `#241109` over `#1A0F0A` primary-900 |
| Scrap | `#F5F0E6` accent-cream | `#2E1B13` primary-800-ish |
| Ghost border | `#E0C9A6` primary-200 | `#5D4037` primary-600 |
| Date numeral | `#3E2723` primary-700 | `#F0E6D2` primary-100 |
| Body / preview | `#5D4037` primary-600 | `#E0C9A6` primary-200 |
| Meta / count / note | `#7D5A3C` primary-500 | `#C9A961` primary-300 |
| Today numeral | `#6F5220` gold-deep | `#C9A961` |
| Thumbtack | `#B76E79` rose | `#D98A9A` (brightened) |
| Shadows | `rgba(62,39,35,.12/.20)` | `rgba(0,0,0,.5/.65)` |

Night turns the board into a dark desk and the scraps into paler slips of paper pinned to it — the
metaphor survives intact.

---

## 10. Accessibility

### 10.1 Contrast (computed against the actual token hexes)
Scrap surface light = `#F5F0E6`; board light = `#F0E6D2`; scrap night = `#2E1B14`; board night =
`#1A0F0A`. WCAG 2.1 relative luminance.

**LIGHT (text on the scrap `#F5F0E6`; ghosts sit on the board `#F0E6D2`):**
| Pair | Ratio | Verdict |
|------|-------|---------|
| primary-700 `#3E2723` date / entry title | **12.17** | AAA ✓ |
| primary-600 `#5D4037` preview / detail meta | **8.20** | AAA ✓ |
| primary-500 `#7D5A3C` kicker / count / note / weekday | **5.44** (on `#F0E6D2`: 5.20) | AA ✓ |
| gold-deep `#6F5220` today numeral | **6.37** | AA ✓ |
| primary-400 `#A67C52` ghost date numeral (17px italic) | **3.29** | **AA-large only** — an empty day's numeral is supplementary; the date is repeated in the cell's `aria-label` and in the panel. Flagged as the one deliberate exception. |
| `#FAF6F0` on gold-deep button | **12.2** | AAA ✓ |
| accent-gold `#C9A961` as small text | **1.98** | **✗ — never; gold-deep or primary-700** |
| ghost border `#E0C9A6` (decorative) | 1.3 | non-text outline, carries no meaning ✓ |
| thumbtack `#B76E79` (decorative) | 3.35 | non-text, decorative ✓ |

**NIGHT (text on the scrap `#2E1B14`; ghosts on `#241109`):**
| Pair | Ratio | Verdict |
|------|-------|---------|
| primary-100 `#F0E6D2` date / title | **13.9** | AAA ✓ |
| primary-200 `#E0C9A6` preview / meta | **11.0** | AAA ✓ |
| primary-300 `#C9A961` kicker / count / note | **7.7** | AAA ✓ |
| gold `#C9A961` today numeral | **7.43** | AA ✓ |
| `#1A0F0A` on gold button | **8.4** | AAA ✓ |

**Encoded rules:**
1. Gold is *fill / ring / thumbtack* only in light mode; gold **text** uses `accent-gold-deep`.
2. The tilt is capped at **±1.6deg** — past ~2deg the date numeral stops reading upright. This cap
   is what keeps every ratio above valid in practice.
3. The one sub-4.5 value (ghost date, 3.29:1) is decorative-by-design and duplicated in the
   `aria-label`; if the team wants it at AA, `text-primary-500` lifts it to 5.44:1 with no other
   change.

### 10.2 Mood dots — never colour alone
- Every slot's `aria-label` names the mood(s): `"October 13, 1 entry, mood Mind-blown"`.
- Entry count printed as text.
- The detail card shows mood as **dot + label**, never colour alone.

### 10.3 Keyboard & focus
- **Tab order:** header nav → 35 slots in grid order → detail entries → favourite buttons →
  Write-this-day. Same as today.
- **Focus-visible:** the outline is applied to the **inner** `.scrap` / `.ghost` (not the rotated
  slot) with `outline-offset: 3px`, so a rotated card can never hide or clip its own focus ring.
- **Touch targets:** slots are ≥96px tall (78px on mobile); nav and favourite are 44×44.

### 10.4 Reduced motion
Handled and load-bearing — see §8. Rotations removed, transitions off, everything renders upright
and legible. The page is fully usable with zero motion.

---

## 11. What the redesign improves vs the current page

1. **The month becomes an object you made.** Written days are physical scraps; empty days are the
   outline of a page not yet torn out. This is the strongest emotional read of the four directions.
2. **Effort is visible.** A wall dense with scraps is a month you showed up for, in a way a grid of
   identical grey cells can never say.
3. **Days get names.** The Caveat note on each scrap ("called home", "the long way") gives the month
   a narrative the current grid has no room for.
4. **Selection is tactile.** The selected scrap lifts off the board, so "which day am I looking at"
   is answered by depth, not just colour.
5. **The dots still carry the data**, and the `aria-label` + count + mood tag keep every state
   accessible.

### Risks / tradeoffs
- **It is the least scannable direction.** A rotated collage is slower to read than an aligned grid
  when you are hunting for a specific date. The tilt cap keeps it usable, but if speed of lookup
  matters most, A or B is the safer choice.
- **Decoration is the whole idea, and it is the first thing reduced-motion removes.** The
  reduced-motion version is deliberately plainer — that is the correct trade, but it should be
  shown to the user rather than discovered.
- **Rotation must stay deterministic.** Deriving the tilt from the day number (not `Math.random()`)
  is what stops the wall re-shuffling on every render.
- **The ghost-date numeral is the one sub-AA value** (3.29:1). Flagged with a one-token fix.
- **Torn edges are decoration** — a `pattern` fill, `aria-hidden`. They must never be the only
  signal for anything (they are not).

---

## 12. Proposed token additions

**None required.** `accent-gold-deep` already exists from the stats work.

One *optional* addition if the team wants the ghost-date numeral at AA without changing its role:
`calendar-ghost-ink: #7D5A3C` (reusing `primary-500`) — but simply using `text-primary-500` on
`.slot.blank .dnum` achieves the same with no new token, and is the recommended fix.

---

## 13. Deliverable index

- **Spec:** this file (`SKETCH.md`)
- **Mockup:** [`mockup.html`](./mockup.html) — self-contained, October 2026 (Oct 1 is a Thursday,
  so 4 offset cells), today = Oct 13 selected and lifted, 16 written days as scraps (including a
  two-entry day), a quiet stretch Oct 16–22 as dashed ghosts, deterministic ±1.6deg tilts,
  reusable SVG torn-edge pattern, thumbtacks, light/night toggle with `localStorage`, working
  favourite toggles, no emoji icons.
