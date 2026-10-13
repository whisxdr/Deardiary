# Calendar — Direction D: "Diary Timeline"

> **LOGIC:** Page-level override. Where this sketch conflicts with the shared
> `design-system/deardiary-calendar/MASTER.md`, this file wins for the Calendar page.
>
> **Team:** Designer D (timeline) — one of four parallel directions.
> **Dials:** Variance 7/10 · Motion 6/10 · Density 4/10 (airy).
> **Sketch:** this spec · [`mockup.html`](mockup.html)
> **Product:** DearDiary — a diary kept as an old leather-bound book.

---

## 1. Concept

A diary is not a spreadsheet. The month grid quietly pretends it is: seven equal
boxes, weekday-aligned, where a day is judged by whether it got ink. **Diary
Timeline** throws the grid away and reads the month the way you read a diary —
top to bottom, in order, as a continuous **spine** running down the page.

Every day that has an entry becomes a **dated node** hung on the spine: a mood
stamp, a one-line preview, and — when you select it — the full entries inline,
exactly where you are reading. Every day with nothing written becomes a **quiet
gap**: a single hairline tick and a faint date, almost nothing at all, so the
written days carry the weight and the blanks read as breathing room. The month
keeps its prev / next / today navigation. Detail lives **inline**, never in a
side panel.

The result is the most editorial of the four directions. It does not ask you to
*hunt* for a day in a grid; it asks you to *flip through the month* and read what
you wrote, in the order you wrote it.

**The reading model.** The spine is chronological, ascending: day 1 at the top,
the last day at the bottom, so it literally reads like pages turning forward.
Days are grouped into **week bands** (a thin rule + a "Week 2 · Oct 5 – 11" label)
that restore the row structure the grid used to give you. On first load the
**today** node is scrolled into view and left **selected and expanded**, so the
page opens on "now" and you scroll up to where the month began or down to where
it is going. Scanning is done with the eye travelling down one continuous column;
finding a date is done with the **month minimap** (below).

### What a node carries (and when)

| Day state | Node body |
|-----------|-----------|
| **Has entries, not selected** (collapsed) | mood stamp + mood label · 1-line preview of the most recent entry · "N entries" (+ time of the last one) |
| **Has entries, selected** (expanded) | each entry as a mini card (title, mood, preview, footer, favourite star) + a **Write this day** outline button |
| **No entries, not selected** (quiet) | one hairline tick + faint date — almost nothing |
| **No entries, selected** (expanded) | the `EmptyDiary` empty state + a **Write this day** gold button |

### What the grid is replaced by

- **At-a-glance month scanning** → the **month minimap** strip (below) and **week bands**.
- **Weekday alignment** → a **weekday label on every node** ("Mon 1", "Thu 8"), so you never need a column to know the day of the week.
- **Selectable days** → every node and every quiet marker is a real, focusable button.

---

## 2. ASCII wireframes

Legend: `●` node with entry · `◎` today (halo) · `┊` quiet marker · `▓` selected/expanded.

> The wireframes are schematic (tight, illustrative days). The canonical data in
> the mockup is **October 2026**, **today = Tuesday, October 13** (selected and
> expanded on load), with a **quiet stretch Oct 16 – 22**. Where a wireframe shows
> "Wed 7 · TODAY" read it as "the today node, expanded" — the exact day is arbitrary.

### 375px (mobile) — single reading column

```
┌───────────────────────────────────────┐
│ DearDiary                    ☾ theme  │  app chrome
├───────────────────────────────────────┤
│  ‹   OCTOBER 2026              Today › │  CalendarHeader (prev / label / today / next)
│  14 entries across 11 days            │  month summary line
│ ┌───────────────────────────────────┐ │
│ │ 1 2 3·4 5·6 7 8·9 ▸10 11 12 13 14 …│ │  month minimap (mood dots, h-scroll)
│ │ ........  ......  ▲      ....     │ │  ticks · ▲ = today
│ └───────────────────────────────────┘ │
├───────────────────────────────────────┤
│ ┃ WEEK 1                      Oct 1–4 │  week band
│ ┃                                    │
│ ●──┬ THU  1                          │  node (stamp+preview)
│ ┃  │ ☺ Happy · 1 entry               │
│ ┃  │ The first morning of October…   │
│ ┃                                    │
│ ┊──┼ FRI  2                          │  quiet marker
│ ┊──┼ SAT  3  (quiet, stacked)         │
│ ●──┴ MON  5                          │
│ ┃  │ ☺ Cool · 1 entry                │
│ ┃  │ New notebook. Fresh ink…        │
├───────────────────────────────────────┤
│ ┃ WEEK 2                      Oct 5–11│
│ ┊──┼ TUE  6                          │
│ ●──┼ ◎ WED  7   TODAY · SELECTED     │  today, expanded
│ ┃  │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃  │ ┃ Wednesday, October 7, 2026  ┃ │  inline detail (was the side panel)
│ ┃  │ ┃ 1 entry · 342 words         ┃ │
│ ┃  │ ┃ ┌───────────────────────┐  ┃ │
│ ┃  │ ┃ │ ☺ Cool      #rain  ☆  │  ┃ │  mini EntryCard
│ ┃  │ ┃ │ Rain on the roof…     │  ┃ │
│ ┃  │ ┃ │ 342 words · 2 min read│  ┃ │
│ ┃  │ ┃ └───────────────────────┘  ┃ │
│ ┃  │ ┃ [   Write this day   ]     ┃ │
│ ┃  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│ ●──┼ THU  8                          │
│ ┊──┴ FRI  9                          │
└───────────────────────────────────────┘
   ↑ spine (--ledger-rule) at a fixed gutter; all nodes hang off it
```

### 768px (tablet) — same column, wider measure

```
┌───────────────────────────────────────────────────────────────┐
│  ‹   OCTOBER 2026                                  Today ›    │
│  14 entries across 11 days                                    │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ 1  2  3· 4  5· 6  7· 8· 9  10 11 12 ▸13 14 … 30 31        │ │  minimap, full month fits
│ └───────────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────────┤
│ ┃  WEEK 1                                        Oct 1 – 4   │
│ ┃                                                            │
│ ●────┬ THU  1                                              │
│ ┃    │ ☺ Happy · 1 entry · The first morning of October felt │  previews run wider (2 lines)
│ ┃    │ like mine again — the light came in sideways…         │
│ ┃                                                            │
│ ●────┼ ◎ WED  7   TODAY · SELECTED                           │
│ ┃    │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃    │ ┃ Wednesday, October 7, 2026 · 1 entry · 342 words ┃  │
│ ┃    │ ┃ ┌───────────────────────────────────────────┐  ┃  │
│ ┃    │ ┃ │ ☺ Cool   #rain                    ☆       │  ┃  │
│ ┃    │ ┃ │ Rain on the roof and nowhere to be…       │  ┃  │
│ ┃    │ ┃ │ 342 words · 2 min read · Home             │  ┃  │
│ ┃    │ ┃ └───────────────────────────────────────────┘  ┃  │
│ ┃    │ ┃ [   Write this day   ]                         ┃  │
│ ┃    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│ ┃    └────────────────────────────────────────────────────  │
└───────────────────────────────────────────────────────────────┘
```

### 1440px (desktop) — sticky minimap rail + reading column

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  DearDiary                                                          ☾ theme │
│  ┌──────────────┐   ‹   OCTOBER 2026                             Today ›    │
│  │  MINIMAP     │   14 entries across 11 days                               │
│  │  S  M  T  W …│  ───────────────────────────────────────────────────────  │
│  │  ·  ·  ▸ ·  ·│                                                     │
│  │  ·  ·  ·  ▲  │  WEEK 1                                    Oct 1 – 4   │
│  │  ·  ·  ·  ·  │  ●────┬ THU  1                                          │
│  │  ......     │  │    │ ☺ Happy · 1 entry · The first morning…          │
│  │  (today ▲)   │  ●────┼ ◎ WED  7   TODAY · SELECTED                      │
│  │              │  │    │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  │  jump to:    │  │    │ ┃ Wednesday, October 7, 2026 · 342 words  ┃   │
│  │  Week 1      │  │    │ ┃ ┌────────────────────────────────────┐ ┃   │
│  │  Week 2 ▲    │  │    │ ┃ │ ☺ Cool  #rain              ☆       │ ┃   │
│  │  Week 3      │  │    │ ┃ │ Rain on the roof and nowhere…      │ ┃   │
│  │  Week 4      │  │    │ ┃ │ 342 words · 2 min read · Home      │ ┃   │
│  │  Week 5      │  │    │ ┃ └────────────────────────────────────┘ ┃   │
│  │              │  │    │ ┃ [   Write this day   ]                ┃   │
│  │  ──────      │  │    │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│  │  STICKY      │  ●────┼ THU  8                                          │
│  │  to top      │  ┊────┼ FRI  9                                          │
│  └──────────────┘  WEEK 3                                    Oct 12 – 18 │
│   ~180px rail      ┊────┼ FRI  16   ← quiet stretch begins              │
│                    ┊────┼ SAT  17   ...                                    │
│                    (reading column max-width ~720px, generous whitespace)  │
└──────────────────────────────────────────────────────────────────────────────┘
```

> The desktop **minimap rail** is a navigator, not decoration: it doubles as a
> month-at-a-glance and a week jump list, replacing the grid's overview function.

---

## 3. Layout spec

### 3.1 Spine alignment

- The spine is a **1px vertical rule** fixed in a left gutter inside the reading
  column. Every node and quiet marker hangs off it; the dot/tick sits centred on
  the spine, content to its right.
- Gutter offsets: **28px** at 375/768px; **32px** at ≥1280px (inside the column).
- Spine colour: **`--ledger-rule`** (the soft ledger margin rule) — literally a
  vertical rule down a diary's margin. It is decorative (non-text) so it may sit
  below 3:1, and it swaps per theme automatically. **No raw hex.**
- Consecutive quiet markers share one continuous spine segment (no gaps in the
  line) so the month reads as one unbroken thread.

### 3.2 Entry-node anatomy (collapsed)

```
[dot on spine]─[weekday  DAY]  ← heading row (mono day, body weekday)
                 [mood disc+label]  ·  [1-line preview]
                 [N entries · time]                    ← meta line (muted)
```
- Dot: **10–12px** circle, fill = `moodColor(firstMood)`, 1px `--ledger-rule` ring.
- Weekday + day number: **JetBrains Mono**, day is the visual anchor.
- Preview: **Inter** 14px, single line, truncated (~72 chars) with ellipsis.

### 3.3 Entry-node anatomy (expanded / selected)

The **whole body** of the `CalendarDayDetail` panel, inlined:
1. **Heading:** `formatLongDate(date)` in Playfair Display + a meta line
   `N entries · X words` (`formatCount` / `formatWordCount`).
2. **Each entry** = a mini `EntryCard` (list layout): mood stamp, relative-time
   `time`, **favourite star** (`aria-pressed`), title, preview, footer (word
   count, reading time, location, private lock), tags.
3. **Write this day** — `buttonVariants({ variant: 'outline' })`, links to
   `ROUTES.write?date=<key>`. Present whenever the day has entries too.
- Card surface: `accent-cream/95` + `border-primary-200/70` + `shadow-soft`
  (matches the real `EntryCard`). Selected wrapper adds
  `border-accent-gold ring-1 ring-accent-gold shadow-soft` — the exact
  selected treatment the grid cell used, carried into the timeline.

### 3.4 Quiet-gap markers

- One **hairline tick** (6px) on the spine + a faint date (`primary-500`, the
  date is meaningful text so it must clear 4.5:1 — see §7).
- Each quiet day is still a **focusable button ≥44×44px** (thin visually, but the
  hit area is padded), so you can select an empty day and be offered
  **Write this day** — behaviour preserved from the grid.
- A run of ≥4 consecutive empty days is grouped under a single italic annotation
  (e.g. *"a quiet stretch — Oct 16 to 22"*) to keep the page airy, while each day
  remains individually selectable.

### 3.5 Week grouping

- Each week is a band: a full-width hairline rule + a small-caps label
  **"WEEK n · Mon d – Sun d"** in Inter. This restores the grid's row rhythm and
  gives the eye a weekly beat.
- Bands are purely visual (`<li>` sections with an `<h3>`); the spine runs
  continuously through them.

### 3.6 A busy month (30+ entries)

- **Nothing paginates or virtualises by default.** The month is one continuous
  feed because it is bounded: at most 31 day-rows, and only days with entries get
  a render-heavy card.
- **Only one node is ever expanded at a time** (the selected day), so the DOM
  stays light even in a full month — collapsed nodes are two lines of text.
- Production performance lever: **`content-visibility: auto` with a
  `contain-intrinsic-size`** on each off-screen day `<li>`, so the browser skips
  layout/paint for months not in the viewport. This is the specified
  virtualisation; it degrades gracefully (no JS, no scroll jank).
- If the team later wants hard windowing, the week bands are the natural chunk:
  reveal one band at a time via an IntersectionObserver. Not required for a month.

---

## 4. Token mapping (existing tokens only — no raw hex in components)

| Timeline element | Tailwind token | Light | Night | Note |
|---|---|---|---|---|
| Page paper | `primary-50` | `#FAF6F0` | `primary-900` `#1A0F0A` | body bg |
| Timeline card / expanded surface | `accent-cream` | `#F5F0E6` | `primary-800` `#2A1A14` | like `EntryCard` |
| **Spine + quiet ticks** | **`ledger-rule`** | `#D98A7E` | `#A15B52` | themed var; decorative |
| Day-node border | `primary-200/70` | `#E0C9A6` | `primary-700` | like `EntryCard` |
| **Selected node** | `accent-gold` + `ring-accent-gold` | `#C9A961` | `#C9A961` | same as grid cell |
| **Today halo** | `ring-primary-400` / `bg-primary-700` chip | `#A67C52` / `#3E2723` | — | grid's today treatment |
| Body / heading text | `primary-700` | `#3E2723` | `primary-100` `#F0E6D2` | 12.17 / 15.18 :1 |
| Secondary text | `primary-600` | `#5D4037` | `primary-200` | 8.20 / 11.71 :1 |
| Muted small text (meta, counts) | `primary-500` | `#7D5A3C` | `primary-300` `#C9A961` | 5.44 / 7.43 :1 |
| Quiet-marker date | `primary-500` | `#7D5A3C` | `primary-300` | date is text → AA |
| **Gold text (never raw gold)** | **`accent-gold-deep`** | `#6F5220` | swaps to `#C9A961` | 6.37 / 7.43 :1 |
| Week-band label | `primary-500` small-caps | `#7D5A3C` | `primary-300` | — |
| Mood disc fill | `moodColor()` | per-mood | per-mood | same as grid dot |
| Favourite star | `accent-gold` | `#C9A961` | `#C9A961` | matches `EntryCardHeader` |
| Write-this-day button | `buttonVariants` gold / outline | as-is | as-is | unchanged |
| Focus ring | `ring-accent-gold` | `#C9A961` | `#C9A961` | app-wide focus |
| Fonts | `display`/`sub`/`body`/`mono`/`hand` | — | — | see §5 |
| Shadows | `shadow-soft` / `shadow-medium` | themed | themed | `theme.css` vars |

**No new tokens are required.** Every value resolves to an existing Tailwind
token or a themed CSS variable already in `theme.css`. Two rules the whole sketch
honours, inherited from the app: gold is **never** used as small text (it is
1.98:1 on cream — use `accent-gold-deep`), and the spine is decorative so
`--ledger-rule` below 3:1 is acceptable.

*Optional, if the team wants a distinct hairline for quiet stretches:* add
`--timeline-gap-rule: #E7D9C4` (light) / `#3E2723` (night) to `theme.css`. Not
required — `primary-200/60` already works.

---

## 5. Typography & spacing

**Type scale** (density 4/10 → airy, generous leading):

| Role | Font | Size / weight | Token |
|---|---|---|---|
| Month label | Playfair Display | 20–22px / 700 | `font-display text-xl` |
| Entry title (expanded) | Playfair Display | 18px / 600 | `font-display text-lg` |
| Day number (node) | JetBrains Mono | 15px / 600 | `font-mono` |
| Weekday label | Inter | 12px / 500 uppercase | `font-body` |
| Preview line | Inter | 14px / 400 | `font-body text-sm` |
| Meta / counts | JetBrains Mono | 11–12px | `font-mono` |
| Week-band label | Inter | 11px / 600 uppercase, tracked | `font-body` |
| Quiet annotation | Cormorant Garamond italic | 16px | `font-sub italic` |
| Decorative flourish | Caveat | 18px | `font-hand` (one only) |

Decorative faces (`display`, `hand`) are for headings and **one** flourish only;
repeated small text is Inter/Mono, per the legibility lesson from the stats page.

**Spacing** (airy, `4/10`): between nodes `lg` (24px); inside a node `sm/md`;
week band padding `xl` (32px) top, `md` bottom; quiet marker rows `md` height
visually but `44px` hit area; page gutters `lg`. Line-height 1.5–1.6 on previews.

**Depth:** entry cards use `shadow-soft`; hover lifts to `shadow-medium` with a
`-translate-y-0.5` transform (no layout shift — anti-pattern respected). The
selected node's ring does the emphasis work; shadows stay subtle so the paper
feels flat and editorial, not glassy.

---

## 6. Motion spec

Every transition is **transform / opacity only** (compositor-friendly), and all
durations/easings reuse the project tokens (`duration-fast/normal/slow`,
`ease-out-expo`).

| Interaction | Duration | Easing | Properties |
|---|---|---|---|
| Node expand / collapse | `slow` 400ms | `ease-out-expo` | `opacity` + `translateY(8→0)`; height follows |
| Month enter (stagger) | `normal` 250ms | `ease-out-expo` | day nodes `fade-slide`, stagger ~**70ms** each, `from: start` |
| Spine draw on enter | `slow` 400ms | `ease-out-expo` | `transform: scaleY(0→1)`, origin top |
| Today halo pulse | 2.6s loop | ease-in-out | `opacity` + `scale` only |
| Card hover | `fast` 150ms | `ease-out-expo` | `translateY(-2px)` + `shadow-soft→medium` |
| Minimap tick / rail | `fast` 150ms | — | `background`, `transform` |

**Stagger** follows the shared MASTER pattern (stagger list from `start`, no
`back.out` — overshoot reads sloppy on informational UI). Nodes below the fold
stagger as they enter, not all at once.

**`prefers-reduced-motion` (mandatory):**
- Every node renders in its **final readable state immediately** — no entry
  requires a scroll effect to become visible. There are no scroll-triggered
  reveals that hide content.
- All transitions collapse to `0.01ms`; the stagger is skipped (all nodes present
  at once); the spine-draw and today-pulse are disabled (`animation: none`).
- Implemented exactly like the stats `story/mockup.html`:
  `@media (prefers-reduced-motion: reduce) { * { transition-duration: .01ms !important; } .node, .spine { opacity:1 !important; transform:none !important; } }`.

**Pause-when-hidden:** the today halo pulse is the only ambient loop; it is
paused via `document.visibilitychange` (and never starts under reduced motion).
Off-screen nodes use `content-visibility: auto`, so nothing animates out of view.

---

## 7. Accessibility

**Contrast** — computed from the real token hexes (WCAG 2.1 relative luminance):

*Light (on `accent-cream #F5F0E6`):*
| Foreground | Ratio | Pass |
|---|---|---|
| `primary-700 #3E2723` (body/headings) | **12.17:1** | AAA body |
| `primary-600 #5D4037` (secondary) | **8.20:1** | AAA body |
| `primary-500 #7D5A3C` (muted/meta/quiet date) | **5.44:1** | AA body (≥4.5) |
| `accent-gold-deep #6F5220` (gold text) | **6.37:1** | AA body |
| `accent-gold #C9A961` **as text** | 1.98:1 | ✗ → never; use `gold-deep` |
| Gold button: `primary-900` on `gold` | 8.36:1 | AA |
| `primary-700` outline-btn text | 8.20:1 | AA |
| Spine `--ledger-rule #D98A7E` | 2.34:1 | decorative only (non-text) |

*Night (on `primary-900`/`primary-800`):*
| Foreground | Ratio | Pass |
|---|---|---|
| `primary-100 #F0E6D2` (body) | 15.18 / 13.50:1 | AAA |
| `primary-200 #E0C9A6` (secondary) | 11.71:1 | AAA |
| `primary-300 #C9A961` (muted/meta) | **7.43:1** (on card) | AA |
| `gold` night button text (`#1A0F0A` on `#C9A961`) | 8.36:1 | AA |

**Structure (this is a list, not a grid):**
- Outer `<section aria-label="October 2026 timeline">` wrapping an **`<ol>`** —
  a diary month is an ordered sequence.
- Page heading order: `<h1>` (sr-only "Calendar of entries") → `<h2>` month
  (in the header) → one `<h3>` per day node (`Monday, October 7, 2026`).
- Each day is an `<li>`; its date is the `<h3>`; expanded entries are `<article>`s.

**Keyboard & focus:**
- Every node and quiet marker is a `<button>` in DOM order (top→bottom), so Tab
  walks the month chronologically. The expanded node's actions (favourite star,
  Write this day) are the next tab stops after the node button.
- **Focus-visible:** `outline-none ring-2 ring-accent-gold` — the app-wide gold
  focus ring, 2px, visible on paper and night alike.
- **Touch targets ≥44×44px:** entry nodes are comfortably tall; quiet markers are
  visually thin but padded to a **44px** hit height so every day is tappable.

**Per-node `aria-label`** (mirrors the grid cell pattern):
`"Monday, October 7, 2026, 1 entry, mood Cool"`; quiet days:
`"Tuesday, October 13, 2026, no entries"`. Expanded entries keep the favourite
button's `aria-label` + `aria-pressed`, and `aria-live="polite"` on the month
label announces month changes.

---

## 8. What this improves, what it costs, and the risks

**Improves vs the current page:**
- **Reads like the diary it is.** The month is a narrative you flip through, not a
  grid you scan — the emotional pitch of DearDiary, finally matched by the UI.
- **Content-forward.** A preview on every written day means the calendar now shows
  *what* you wrote, not just *that* you wrote — the grid could only ever show dots.
- **Detail without a detour.** Entries open inline where your eye already is; no
  side panel, no split attention, better on mobile (the panel was cramped at 375px).
- **Quiet days feel intentional.** A hairline tick reads as rest; a blank grid box
  read as a gap or a bug.

**Costs (honest):**
- **Month-at-a-glance is gone.** You cannot see the whole month's shape in one
  fixed frame the way the grid allowed. *Compensation:* the month minimap strip
  (mood dots per day + today caret) and week bands restore density-at-a-glance and
  orientation — but it is a smaller, denser signal than a full grid.
- **Reaching an early date takes scrolling.** A date on day 3 is far down the
  column if today is day 20. *Compensation:* auto-scroll to today on load, the
  minimap as a jump control, and (≥1280px) the sticky week jump rail.
- **Longer pages.** A full 31-day month with many entries is a long scroll. Mitigated
  by `content-visibility: auto` and one-node-at-a-time expansion.

**Risks / tradeoffs:**
- Ascending order (day 1 → 31) matches "flipping through" but buries today at the
  bottom; the auto-scroll + minimap are doing real work here, and a
  most-recent-first toggle is a one-line flip if testing shows users want it.
- The preview line invites long truncation bugs on narrow screens — cap at 72 chars
  with ellipsis and test CJK/emoji-free bodies.
- Quiet markers must stay `primary-500` (≥4.5:1); the temptation to fade them to
  `primary-400` (3.29:1) for "quiet" would break AA since the date is meaningful.
- `content-visibility: auto` needs a `contain-intrinsic-size` tuned to node height
  or scroll anchoring jitters — verify on a real full month before shipping.

---

## 9. Reference

- Design system: [`../../deardiary-calendar/MASTER.md`](../../deardiary-calendar/MASTER.md)
- Sketches index: [`../README.md`](../README.md)
- House style / toggle / reveal technique: [`../../deardiary-stats/sketches/story/mockup.html`](../../deardiary-stats/sketches/story/mockup.html)
- Visual mockup: [`mockup.html`](mockup.html)
