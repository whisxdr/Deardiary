# Almanac Pages — DearDiary Calendar Sketch

> **Designer A** · Direction: *Almanac Pages* · Dials: variance 5/10 · motion 4/10 · density 6/10
> Companion mockup: [`mockup.html`](./mockup.html) (self-contained, light/night toggle)
> Status: build-ready spec. Every visual value maps to an **existing** project token unless a new token is explicitly proposed below.

---

## 1. Concept

**"A page from an old farmer's almanac."**

The calendar already owns the diary metaphor; Almanac Pages pushes it to its most *bookish*
extreme. Instead of a grid of app tiles, the month is set as a printed almanac page:

- A **double-rule masthead** carrying the month in large Playfair Display with the year in italic —
  the way an almanac prints its issue date — plus prev/next/today controls.
- A **soft red margin rule** down the left, the same one the stats ledger uses
  (`--ledger-rule`), which is what makes the page read as *ruled paper* rather than a UI.
- A **weekday strip in small caps** above the grid, with the weekend days set in italic to mark
  them out, exactly as a printed calendar does.
- Day cells are **ruled boxes**: the date numeral in Playfair, mood dots beneath, the entry count
  in mono, and — where there is room — a **handwritten Caveat note** naming the day
  ("the long way", "called home"). This is the almanac's *marginalia*.
- Empty days are not blank boxes; they carry a **single hairline at the foot of the cell**, so a
  quiet day reads as a ruled line waiting to be written on.
- The day-detail panel is set as a **marginal annotation**: a gold left border, an italic summary,
  a dashed rule, and a Caveat gloss in the margin voice.

The result is calm, typographic and unmistakably printed. It is the least "app-like" of the four
directions and the closest to a real object on a desk.

---

## 2. What carries over from the current page

Everything, unchanged in behaviour:

| Current piece | Almanac treatment |
|---------------|-------------------|
| `CalendarHeader` (month label, prev/next/today) | The **masthead**: double rule, Playfair month + italic year, gold/sage/rose tick rule, nav controls |
| `CalendarWeekdays` | A **small-caps weekday strip** above the grid, weekend days in italic |
| `CalendarGrid` | The **ruled month grid** — same 7 columns, same `startOfWeek` alignment, offset cells for the previous/next month |
| `CalendarCell` | A **ruled day box**: Playfair date, mood dots, mono count, Caveat note, quiet hairline when empty |
| `CalendarDayDetail` | A **marginal annotation panel** with the day's entries and the Write-this-day action |

Newly surfaced: the Caveat day-note (currently nothing names a day), and a **mood key** under the
panel so the dot language is explained on the page instead of living only in a `title`.

---

## 3. ASCII wireframes

### 3.1 Mobile — 375px (margin rule collapses, grid stays 7 columns)

```
┌──────────────────────────────────┐
│ DearDiary / Calendar      (☾)    │
├──────────────────────────────────┤
│ THE ALMANAC OF DAYS              │
│ October 2026                     │  ← Playfair + italic year
│ ▬▬▬▬ ▬▬ ▬            [Today][‹][›]│  ← tick rule + nav
│ ════════════════════════════════ │  ← double rule
├──────────────────────────────────┤
│ Sun Mon Tue Wed Thu Fri  Sat     │  ← small caps, weekend italic
├──────────────────────────────────┤
│ ┌────┬────┬────┬────┬────┬────┬────┐
│ │ 27 │ 28 │ 29 │ 30 │  1 │  2 │  3 │
│ │    │    │    │    │ •  │    │ •  │  ← 1/3 are this month
│ │    │    │    │    │1 en│    │1 en│
│ └────┴────┴────┴────┴────┴────┴────┘
│ ┌────┬────┬────┬────┬────┬────┬────┐
│ │  4 │  5 │  6 │  7 │  8 │  9 │ 10 │
│ │    │ •  │ •  │ ─  │ •  │ ─  │ •  │
│ │    │1 en│1 en│    │1 en│    │1 en│
│ └────┴────┴────┴────┴────┴────┴────┘
│        ⋮ (five more weeks)        │
│ ┌────┬────┬────┬────┬────┬────┬────┐
│ │ 11 │ 12 │[13]│ 14 │ 15 │ 16 │ 17 │  ← 13 = today + selected
│ │ •• │ •  │ •  │ ─  │ •  │ ─  │ ─  │
│ │2 en│1 en│1 en│    │1 en│    │    │
│ └────┴────┴────┴────┴────┴────┴────┘
│        ⋮                          │
├──────────────────────────────────┤
│ THE SELECTED DAY                 │  ← annotation panel
│ Tuesday, October 13              │
│ 1 entry · 214 words              │
│ ─────────────────────────────    │  ← dashed rule
│ this page                        │  ← Caveat gloss
│ Something finally clicked        │
│ ● Mind-blown                     │
│ Stared at the problem for a week…│
│ 214 words · 1 min · 09:35 #work ★│
│ [ + Write this day ]             │
│ ─────────────────────────────    │
│ ● Happy ● Sad ● Angry ● Tired …  │  ← mood key
├──────────────────────────────────┤
│ * every mark tallied from the     │
│   entries kept in this browser.   │
└──────────────────────────────────┘
```

### 3.2 Tablet — 768px (margin rule appears, roomier cells)

```
┌────────────────────────────────────────────────────────────┐
│ DearDiary / Calendar                        Your writing year (☾) │
├────────────────────────────────────────────────────────────┤
│  ┃ THE ALMANAC OF DAYS                                     │
│  ┃ October 2026                       [Today][‹][›]        │  ← red margin rule
│  ┃ ▬▬▬▬ ▬▬ ▬                                              │
│  ┃ ══════════════════════════════════════════════════════  │
│  ┃ Sun  Mon  Tue  Wed  Thu   Fri    Sat                    │
│  ┃ ┌────┬────┬────┬────┬────┬────┬────┐                    │
│  ┃ │ 27 │ 28 │ 29 │ 30 │  1 │  2 │  3 │                    │
│  ┃ │    │    │    │    │ •  │    │ •  │                    │
│  ┃ │    │    │    │    │1 en│    │1 en│                    │
│  ┃ └────┴────┴────┴────┴────┴────┴────┘                    │
│  ┃      ⋮ (six weeks)                                      │
│  ┃ ┌────┬────┬────┬────┬────┬────┬────┐                    │
│  ┃ │ 11 │ 12 │[13]│ 14 │ 15 │ 16 │ 17 │                    │
│  ┃ │ •• │ •  │ ●  │ ─  │ •  │ ─  │ ─  │                    │
│  ┃ │2 en│1 en│1 en│    │1 en│    │    │                    │
│  ┃ └────┴────┴────┴────┴────┴────┴────┘                    │
├──┸─────────────────────────────────────────────────────────┤
│  ┃ THE SELECTED DAY                                        │
│  ┃ Tuesday, October 13 · 1 entry · 214 words               │
│  ┃ ────────────────────────────────────────────────        │
│  ┃ Something finally clicked    ● Mind-blown        ★      │
│  ┃ Stared at the problem for a week and then it simply     │
│  ┃ opened. Wrote it down before it could close again.      │
│  ┃ 214 words · 1 min · 09:35 · #work                       │
│  ┃ [ + Write this day ]                                    │
│  ┃ ● Happy ● Sad ● Angry ● Tired ● Thoughtful ● Loved …    │
└────────────────────────────────────────────────────────────┘
```

### 3.3 Desktop — 1440px (full margin, widest cells)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ DearDiary / Calendar                                        Your writing year (☾)│
├────────────────────────────────────────────────────────────────────────────────┤
│  ┃ THE ALMANAC OF DAYS                                                         │
│  ┃ October 2026                                    [Today][‹][›]               │  ← red rule
│  ┃ ▬▬▬▬▬▬▬▬ ▬▬▬ ▬                                                             │    at 116px
│  ┃ ═══════════════════════════════════════════════════════════════════════    │
│  ┃   Sun      Mon      Tue      Wed      Thu       Fri        Sat               │
│  ┃ ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐            │
│  ┃ │   27   │   28   │   29   │   30   │   1    │   2    │   3    │            │
│  ┃ │        │        │        │        │   •    │        │   •    │            │
│  ┃ │        │        │        │        │ 1 entry│        │ 1 entry│            │
│  ┃ │        │        │        │        │first   │        │the long│            │
│  ┃ │        │        │        │        │ light  │        │  way   │            │
│  ┃ └────────┴────────┴────────┴────────┴────────┴────────┴────────┘            │
│  ┃        ⋮ (six weeks)                                                        │
│  ┃ ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐            │
│  ┃ │   11   │   12   │  [13]  │   14   │   15   │   16   │   17   │            │
│  ┃ │  • •   │   •    │  TODAY │   ―    │   •    │   ―    │   ―    │            │
│  ┃ │ 2 entry│ 1 entry│   •    │        │ 1 entry│        │        │            │
│  ┃ │ two    │ running│ 1 entry│        │ rain   │        │        │            │
│  ┃ │ pages  │  low   │this    │        │ again  │        │        │            │
│  ┃ │        │        │ page   │        │        │        │        │            │
│  ┃ └────────┴────────┴────────┴────────┴────────┴────────┘            │
│  ┃        ⋮                                                                    │
│  ┃ ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐            │
│  ┃ │   25   │   26   │   27   │   28   │   29   │   30   │   31   │            │
│  ┃ │   •    │   •    │   ―    │   •    │   ―    │   •    │   •    │            │
│  ┃ │ 1 entry│ 1 entry│        │ 1 entry│        │ 1 entry│ 1 entry│            │
│  ┃ │  the   │ plans  │        │turning │        │ a steady│ last   │            │
│  ┃ │ market │        │        │  over  │        │  day   │  page  │            │
│  ┃ └────────┴────────┴────────┴────────┴────────┴────────┴────────┘            │
├──┸─────────────────────────────────────────────────────────────────────────────┤
│  ┃ THE SELECTED DAY                                                            │
│  ┃ Tuesday, October 13                                                         │
│  ┃ 1 entry · 214 words                                                         │
│  ┃ ────────────────────────────────────────────────────────────────            │
│  ┃ the page you will remember this month for                                  │
│  ┃                                                                             │
│  ┃ Something finally clicked                       ● Mind-blown            ★  │
│  ┃ Stared at the problem for a week and then it simply opened. Wrote it       │
│  ┃ down before it could close again.                                          │
│  ┃ 214 words · 1 min · 09:35 · #work                                          │
│  ┃ [ + Write this day ]                                                       │
│  ┃ ────────────────────────────────────────────────────────────────            │
│  ┃ ● Happy ● Sad ● Angry ● Tired ● Thoughtful ● Loved ● Cool ● Anxious …      │
├──┸─────────────────────────────────────────────────────────────────────────────┤
│  ┃ * every mark tallied from the entries kept in this browser.                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Layout spec

```
Masthead / weekday strip / grid / panel / footnote all share one left inset of 152px,
  which is the almanac's margin. The red margin rule is pinned at left:116px (2px wide).
  Below 900px the inset collapses to 0 and the rule hides — the page becomes a plain
  column, because a 152px margin on a 375px screen leaves nothing to write in.

Grid: display grid; grid-template-columns: repeat(7, 1fr);
  Cell borders: 1px solid var(--border) on right + bottom; the grid itself carries
  left + top so the outline is closed with no double-weight edges.
  Cell min-height: 92px desktop / 78px below 900px.
  Cell padding: 8px 6px 9px.
  Alignment: unchanged from CalendarGrid — eachDayOfInterval(startOfWeek(startOfMonth),
  endOfWeek(endOfMonth)); offset cells render with the previous/next month's numbers
  and `opacity: 0.42`.

Weekday strip: same 7 columns, one border-bottom (1px solid var(--ink)), each cell
  padded 8px 0 7px, separated by 1px var(--border-soft) vertical rules.

Panel: margin-left 152px; border 1px var(--border); border-left 4px var(--gold);
  radius 12px; padding 22px 24px 24px; background var(--card); shadow-soft.

Container: max-width 1180px; side padding 32px desktop / 16px mobile.
```

---

## 5. Token mapping

Every value is an **existing** token from `tailwind.config.js` / `theme.css`. Raw hex appears in
the mockup's `:root` only as the concrete stand-in.

| Visual role | Token / value | Where used |
|-------------|---------------|------------|
| Page background | `bg-primary-50` `#FAF6F0` | `<body>` |
| Panel surface | `bg-accent-cream` `#F5F0E6` | detail panel |
| Grid rule (light) | `border-primary-200` `#E0C9A6` | cell right/bottom borders, grid left/top |
| Grid rule (night) | `border-primary-600` `#5D4037` | same, `dark:` |
| Soft rule | `border-primary-200/60` | quiet-day hairline, weekday separators |
| Margin rule | `ledger-rule` `#D98A7E` (night `#A15B52`) | the red rule at 116px |
| Masthead double rule | `border-primary-800` `#2A1A14` | `border-bottom: 3px double` |
| Date numeral | `text-primary-700` `#3E2723` | `.dnum` (12.17:1) |
| Entry title | `text-primary-700` `#3E2723` | panel `.entry-title` |
| Body / preview | `text-primary-600` `#5D4037` | `.entry-preview` (8.20:1) |
| Weekday strip | `text-primary-600` `#5D4037` | `.weekday-strip` |
| Weekend weekday | `text-primary-500` `#7D5A3C` + italic | `.we` (5.44:1) |
| Kicker / meta / count | `text-primary-500` `#7D5A3C` | `.head-kicker`, `.panel-meta`, `.dcount` (5.44:1) |
| Empty-day numeral | `text-primary-500` `#7D5A3C` | `.day.empty .dnum` |
| Caveat note | `text-primary-500` `#7D5A3C` | `.day-note`, `.panel-note` (5.44:1) |
| Today tint | `bg-accent-gold/16` + `ring-accent-gold` inset | `.day.is-today` |
| Selected tint | `bg-accent-gold/10` + inset ring + gold cap | `.day.is-selected` |
| Selected/today numeral | `text-accent-gold-deep` `#6F5220` (night `--accent-gold-deep` → `#C9A961`) | `.is-today .dnum`, `.is-selected .dnum` |
| Tick rule (gold/sage/rose) | `bg-accent-gold` / `bg-accent-sage` / `bg-accent-rose` | `.r1/.r2/.r3` |
| Nav hover | `bg-accent-gold/12` + `border-accent-gold` | `.nav-btn:hover` |
| Mood dots | `moodColor(mood)` from `src/constants/moods.ts` | `.dot`, mood key, mood tag |
| Write button (primary) | `bg-accent-gold-deep` + `text-primary-50` | `.write-btn` |
| Panel accent border | `border-accent-gold` | `.panel` `border-left: 4px` |
| Focus ring | `outline: 3px solid var(--gold)` + `outline-offset` | every interactive |
| Display font | `font-display` (Playfair Display) | month title, date numeral, entry title, panel date |
| Serif italic | `font-sub` (Cormorant Garamond) | panel meta, entry preview |
| Body | `font-body` (Inter) | kickers, weekday strip, buttons, mood key |
| Mono | `font-mono` (JetBrains Mono) | entry counts, word/time/reading footers |
| Hand | `font-hand` (Caveat) | day notes, panel gloss, footnote |
| Radius | `rounded-sm` 4px cells / `rounded-lg` 12px panel | grid / panel |
| Shadow | `shadow-soft` panel / `shadow-medium` hover | panel / write button |
| Motion | `duration-fast` 150ms hover / `duration-normal` 250ms lift | cells / buttons |

**No new tokens are required.** `ledger-rule` and `accent-gold-deep` already exist from the
stats work.

---

## 6. Component-by-component spec (all five pieces)

### 6.1 Masthead (replaces `CalendarHeader`)
- **Shows:** month name + year, prev/next/today. Replaces `monthFormatter` output with
  Playfair + an italic `<span class="yr">` for the year.
- **Structure:** kicker ("The Almanac of Days") → `<h1>` month + italic year → tick rule
  (3 spans, decorative) → `border-bottom: 3px double var(--ink)`.
- **Nav:** Today as a small-caps text button (`min-height 44px`), prev/next as 44×44 icon buttons
  (`CaretLeft`/`CaretRight`).
- **States:** hover = `bg-accent-gold/12` + gold border + ink text, 150ms. `:focus-visible` =
  3px gold outline, offset 2.
- **A11y:** the month label stays `aria-live="polite"` exactly as today, so a month change is
  announced.

### 6.2 Weekday strip (replaces `CalendarWeekdays`)
- **Shows:** Sun–Sat.
- **Structure:** same `repeat(7, 1fr)`, `font-body 11px/700`, `text-transform: uppercase`,
  `letter-spacing: 0.16em`, `text-primary-600`. Fri/Sat add `.we` → `text-primary-500`, italic,
  no uppercase, so the weekend reads differently at a glance.
- **A11y:** `aria-hidden="true"` — the cell labels already name the weekday, so a spoken
  "Sun Mon Tue…" row before 31 cells is noise. (The current implementation is a plain row; this
  is a deliberate improvement.)

### 6.3 Ruled month grid (replaces `CalendarGrid`)
- **Shows:** unchanged logic — `startOfWeek`/`endOfWeek` interval, offset cells, `byDay` map.
- **Structure:** `repeat(7, 1fr)` with 1px `--border` rules; the grid element carries the left and
  top borders so the outline closes without double-weight seams.
- **A11y:** keeps `role="grid"` + `aria-label="Month grid"`.

### 6.4 Ruled day box (replaces `CalendarCell`)
- **Shows:** date numeral, today pill, mood dots, entry count, Caveat note. Every prop the
  current cell takes (`date`, `moods`, `count`, `isToday`, `isSelected`, `isCurrentMonth`,
  `onSelect`) is preserved.
- **Structure:** `min-height 92px`, flex column centred. Date numeral Playfair `19px/700`
  `text-primary-700`. Dots 7px, `moodColor()`, first 4 then `+N`. Count in mono `10px`.
  Caveat note `15px`, single line, ellipsised.
- **States:**
  - `isToday` → `bg-accent-gold/16` + `inset 0 0 0 1px var(--gold)` + a "Today" pill
    (9px uppercase, gold border) + numeral in `accent-gold-deep`.
  - `isSelected` → `bg-accent-gold/10` + `inset 0 0 0 2px var(--gold)` + a 3px gold cap along the
    top edge (`::before`), so selection reads even in a peripheral glance.
  - `!isCurrentMonth` → `opacity: 0.42`, no tint, no ring.
  - `count === 0` → `.quiet`: a 1px `--rule` hairline across the foot of the cell (`::after`),
    which is what makes an empty day read as a ruled line waiting for ink.
- **A11y:** `aria-label` = `"October 13, 1 entry, mood Mind-blown, today"` (the current label
  already does this; the month name is spelled out rather than relying on the grid label).
  `aria-pressed={isSelected}`. `:focus-visible` = 3px gold outline with `offset: -3px` so the ring
  sits inside the cell and never overlaps its neighbour.
- **Touch target:** the cell is ≥92px tall — comfortably over 44px.

### 6.5 Marginal annotation panel (replaces `CalendarDayDetail`)
- **Shows:** the selected day's long date, entry/word count, every entry with its favourite
  toggle, the Write-this-day action, and a mood key.
- **Structure:** kicker → `<h2>` Playfair `26px` → italic meta → **dashed rule** → Caveat gloss →
  entries → actions → mood key.
- **Entries:** each is `title (Playfair 18px) · mood tag (dot + label) · preview (Cormorant 17px,
  1.5 line-height) · footer (mono words/reading/time/tags) · favourite button (44×44, gold when
  pressed)`.
- **Write this day:** primary gold-deep button in the empty branch, outline in the populated
  branch — the same two variants the current component already distinguishes, preserved.
- **Empty branch:** keeps the current `EmptyDiary` illustration + "Nothing written yet" copy and
  the gold Write-this-day.
- **Mood key (new):** all 12 moods as dot + label in a wrapping row, so the dot language is
  explained on the page rather than living only in a `title` attribute.

---

## 7. Typography, spacing, depth

### Typography scale
| Role | Font | Size / weight | Colour |
|------|------|---------------|--------|
| Kicker | `font-body` | 10px / 700, tracking 0.22em, uppercase | `text-primary-500` |
| Month title | `font-display` | 34–46px / 700, tracking −0.5px | `text-primary-800` |
| Year | `font-display` | same, italic / 500 | `text-primary-500` |
| Weekday strip | `font-body` | 11px / 700, tracking 0.16em, uppercase | `text-primary-600` |
| Weekend weekday | `font-body` | 11px, italic, no uppercase | `text-primary-500` |
| Date numeral | `font-display` | 19px / 700 | `text-primary-700` |
| Today pill | `font-body` | 9px / 700, tracking 0.14em, uppercase | `text-primary-500` |
| Entry count | `font-mono` | 10px | `text-primary-500` |
| Day note | `font-hand` | 15px / 600 | `text-primary-500` |
| Panel date | `font-display` | 26px / 700 | `text-primary-800` |
| Panel meta | `font-sub` | 16px, italic | `text-primary-500` |
| Panel gloss | `font-hand` | 19px / 600 | `text-primary-600` |
| Entry title | `font-display` | 18px / 600 | `text-primary-700` |
| Entry preview | `font-sub` | 17px / 400, line-height 1.5 | `text-primary-600` |
| Entry footer | `font-mono` | 11px | `text-primary-500` |
| Mood key | `font-body` | 12px | `text-primary-600` |
| Footnote | `font-hand` | 20px | `text-primary-500` |

### Spacing
`xs 4` (dot gaps) · `sm 8` (cell padding, weekday strip padding) · `md 16` (panel internal) ·
`lg 24` (grid↔panel gap) · `xl 32` (page side) · margin inset **152px** · cell `min-height 92px`
(78px below 900px) · cell padding `8px 6px 9px`. Density 6/10 — a printed page has room.

### Depth
Almost flat, which is the point. One shadow level on the panel (`shadow-soft`); the write button
lifts to `shadow-medium` on hover. The grid's structure comes from **rules**, not elevation.

---

## 8. Motion spec (motion 4/10 — restrained)

- **Duration:** `--duration-fast` 150ms for cell hover and nav hover; `--duration-normal` 250ms for
  the write-button lift.
- **Properties:** **background + border-color + transform only.** No width/height, no layout shift.
- **Hover:** day cell background wash; nav gold wash; write button `translateY(-2px)` + shadow step.
- **Month change:** the grid re-renders. Optional: a single 250ms `fade-slide` (the project already
  ships this keyframe) on the grid container. Off under reduced motion.
- **Never:** parallax, scroll-scrub, per-cell stagger (35 cells animating in sequence is noise on a
  calendar), looping decoration.
- **`prefers-reduced-motion: reduce`:** all transitions disabled; the month-change fade renders the
  final state immediately.

---

## 9. Dark mode (`data-theme="night"`)

| Role | Light | Night |
|------|-------|-------|
| Page | `#FAF6F0` primary-50 | `#1A0F0A` primary-900 |
| Panel | `#F5F0E6` accent-cream | `#2A1A14` primary-800 |
| Grid rule | `#E0C9A6` primary-200 | `#5D4037` primary-600 |
| Soft rule | `#E0C9A6` @60% | `#4E342E` |
| Margin rule | `#D98A7E` | `#A15B52` (softened) |
| Date numeral | `#3E2723` primary-700 | `#F0E6D2` primary-100 |
| Body / preview | `#5D4037` primary-600 | `#E0C9A6` primary-200 |
| Meta / count / note | `#7D5A3C` primary-500 | `#C9A961` primary-300 |
| Today/selected numeral | `#6F5220` gold-deep | `#C9A961` (via `--accent-gold-deep`) |
| Write button | gold-deep bg / `#FAF6F0` text | `#C9A961` bg / `#1A0F0A` text |
| Shadows | brown-tinted | `rgba(0,0,0,.45)` |

Night keeps the printed feel: darker paper, lighter ink, and the red margin rule softens so it
does not glare.

---

## 10. Accessibility

### 10.1 Contrast (computed against the actual token hexes)
Panel/cell background light = `#F5F0E6`; night = `#2A1A14`. WCAG 2.1 relative luminance.

**LIGHT (on `#F5F0E6`):**
| Pair | Ratio | Verdict |
|------|-------|---------|
| primary-700 `#3E2723` date numeral / entry title | **12.17** | AAA ✓ |
| primary-600 `#5D4037` preview / weekday strip | **8.20** | AAA ✓ |
| primary-500 `#7D5A3C` kicker / count / note / footnote | **5.44** | AA ✓ |
| gold-deep `#6F5220` today & selected numeral | **6.37** | AA ✓ |
| `#FAF6F0` on gold-deep button | **12.2** | AAA ✓ |
| accent-ink `#1A237E` (mood key borders) | **11.66** | AAA ✓ |
| accent-gold `#C9A961` as small text | **1.98** | **✗ — never; gold-deep or primary-700 instead** |
| margin rule `#D98A7E` | 2.9 | decorative only, carries no meaning ✓ |

**NIGHT (on `#2A1A14`):**
| Pair | Ratio | Verdict |
|------|-------|---------|
| primary-100 `#F0E6D2` date numeral / title | **13.50** | AAA ✓ |
| primary-200 `#E0C9A6` preview / weekday | **10.41** | AAA ✓ |
| primary-300 `#C9A961` meta / count / note | **7.43** | AAA ✓ |
| gold `#C9A961` today/selected numeral | **7.43** | AA ✓ |
| `#1A0F0A` on gold button | **8.4** | AAA ✓ |

**Encoded rule:** gold is a *fill / rule / ring* colour in light mode; any gold **text** uses
`accent-gold-deep`. The red margin rule is decorative and never load-bearing.

### 10.2 Mood dots — never colour alone
- Every cell's `aria-label` names the mood(s) in words: `"October 13, 1 entry, mood Mind-blown"`.
- The entry count is printed as text under the dots.
- The **mood key** maps every colour to its name on the page.
- The panel shows the mood as a **dot + label** tag, never colour alone.

### 10.3 Keyboard & focus
- **Tab order:** nav controls → 35 day cells in grid order → panel entries → favourite buttons →
  Write-this-day. Exactly the current order.
- **Focus-visible:** `outline: 3px solid var(--gold); outline-offset: -3px` on cells (inside, so it
  cannot overlap a neighbour) and `offset: 2px` elsewhere. Never `outline: none`.
- **Touch targets:** nav and favourite are 44×44; day cells are ≥92px tall.

### 10.4 Reduced motion
All transitions disabled; the optional month-change fade renders immediately. The page is fully
usable with zero animation.

---

## 11. What the redesign improves vs the current page

1. **It reads as an object, not an interface.** The masthead, margin rule, small-caps weekday strip
   and ruled cells make the calendar feel like a page torn from an almanac — the diary metaphor the
   rest of the app already commits to.
2. **Days get names.** The Caveat note gives each written day a human label ("the long way",
   "called home"), which no version of the current grid has.
3. **Empty days read as intent.** A quiet day is a ruled line waiting for ink rather than a blank
   grey box.
4. **Selection is findable without reading.** The gold cap along the selected cell's top edge is
   visible peripherally; today has both a pill and a tint.
5. **The dot language is explained on the page** by the mood key, instead of only in `title`
   tooltips.

### Risks / tradeoffs
- **The 152px margin costs width.** On a 1180px container the grid still has ~1000px (≈143px per
  cell), but on a 768px tablet the cells get tight — hence the collapse below 900px.
- **Six rows of 92px cells** makes the page taller than the current `h-20` (80px) grid; the
  fold shows about four weeks instead of five.
- **The Caveat note can crowd a busy cell** — dots + count + note in 92px. It is capped at one
  line and ellipsised, and the spec marks it optional on cells with 3+ entries.
- **Least "app-like" of the four.** If the user wants the calendar to feel like a modern tool
  rather than a printed page, this is the wrong direction — that is what B and D are for.

---

## 12. Proposed token additions

**None.** `ledger-rule` and `accent-gold-deep` already exist from the stats work and cover
everything this direction needs.

---

## 13. Deliverable index

- **Spec:** this file (`SKETCH.md`)
- **Mockup:** [`mockup.html`](./mockup.html) — self-contained, October 2026 (Oct 1 is a Thursday,
  so 4 offset cells), today = Oct 13 selected and expanded, 16 written days including a two-entry
  day and a quiet stretch, light/night toggle with `localStorage`, working favourite toggles, no
  emoji icons (all inline SVG).
