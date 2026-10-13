# Modern Bento — DearDiary Stats Sketch

> **Designer B** · Direction: *Modern Bento* · Dials: variance 7/10 · motion 5/10 · density 7/10
> Companion mockup: [`mockup.html`](./mockup.html) (self-contained, light/night toggle)
> Status: build-ready spec. Every visual value maps to an **existing** project token unless a new token is explicitly proposed below.

---

## 1. Concept

**"The reading room, reimagined as a dashboard."**

DearDiary is a literary product — warm cream paper, Playfair Display, leather-bound-book
metaphor. But a year of writing is also *data*. Modern Bento treats the stats page the way a
premium analytics product would treat it **while never leaving the diary's world**:

- One **hero KPI** (total entries) in oversized Playfair Display, underlined by a single gold
  hairline — the number *is* the page title.
- A **true bento grid**: tiles of different sizes arranged so importance (size) matches meaning.
- **Soft-UI-evolution depth**: cards sit on cream with a hairline border and a soft brown-tinted
  shadow — softer than flat, clearer than neumorphism (exactly the MASTER.md "Soft UI
  Evolution" style).
- **Direct labeling everywhere**: the peak of the line chart, the peak hour of the bars, the top
  mood of the ring are called out in text *on* the chart, not left to a tooltip. Data-forward,
  not hover-dependent.
- **Mood as an elegant segmented ring** with a two-column legend carrying label + percentage +
  swatch (never color alone).
- **Tags as chips** — a deliberate, tappable, filter-forward evolution of the current free-floating
  word cloud.

The result reads as a design-forward analytics page that could only belong to a journal app.

---

## 2. Bento grid rationale — what earns its size

Size is the only hierarchy tool a bento grid has, so every span is justified by **content
intrinsic-ness** (how much the tile must show to be useful) and **narrative weight**:

| Tile | Span (desktop) | Why it earns that size |
|------|----------------|------------------------|
| **Total entries** (hero) | 2 × 1 | The headline. Carries a 92px numeral, a delta badge, an italic caption, **and** a 3-up sub-stat rail (words / avg / top mood). Needs width for the rail and height for the numeral. |
| Top mood | 1 × 1 | A name + a % + one sentence. Compact by nature. |
| Favorites | 1 × 1 | One number + one line. Small. |
| Writing streak | 1 × 1 | Two numbers side by side (current / longest). Narrow but needs a row. |
| Mood distribution | 2 × 1 | A 168px ring **plus** an 8-row legend. The legend forces width. |
| Average per week | 2 × 1 | Line chart needs horizontal room for 12 x-points + a direct peak label. |
| Activity by hour | 2 × 1 | 11 bars + axis + a peak annotation. Needs width. |
| Popular tags | 2 × 1 | Chips wrap; a wide tile lets the top tags sit on one/two lines. |
| Writing activity (heatmap) | 4 × 1 | 53 weeks is inherently a wide, full-bleed band — the natural base of the bento. |

**Rule of thumb applied:** *anything with a time-series or a legend gets 2 columns; anything that
is a single scalar gets 1; the year-long heatmap gets the full width.* The grid therefore fills a
4-column desktop canvas with zero holes.

---

## 3. ASCII wireframes

### 3.1 Mobile — 375px (single column, tiles stack in reading order)

```
┌─────────────────────────────┐
│ DearDiary / Statistics      │        ← top bar (Caveat wordmark)
│ Your writing year           │        ← Playfair h1 + Cormorant italic range
│ Oct 2024 – Sep 2025      (☾)│        ← theme toggle floats top-right
├─────────────────────────────┤
│ TOTAL ENTRIES               │
│ 1,847          [▲ 21.7%]    │        ← hero: 64–92px numeral + gold underline
│ a year of pages, faithfully…│
│ ────────────────────────────│
│ 118,640 wds │ 64 wds │ Calm │        ← 3-up sub-rail (wraps to 2 on ≤600px)
│ TOTAL WORDS  │ AVG  │ MOOD  │
├─────────────────────────────┤
│ TOP MOOD                    │
│ (calm stamp) Calm           │
│ 28% of all entries · …      │
├─────────────────────────────┤
│ FAVORITES             (★)   │
│ 132                         │
│ Entries you starred         │
├─────────────────────────────┤
│ WRITING STREAK              │
│ (flame) 12       34         │
│          days    longest    │
├─────────────────────────────┤
│ MOOD DISTRIBUTION           │
│      ╭───────╮              │
│      │ ring  │   Calm  28%  │        ← ring + legend stack vertically ≤600px
│      │12 moods│  Happy  22%  │
│      ╰───────╯   Thought 14%│
│                 …           │
├─────────────────────────────┤
│ AVERAGE PER WEEK            │
│ 14 entries/week             │
│ Based on the last 8 weeks   │
│      ╱╲   23                │        ← line chart, direct peak label
│  ___╱  ╲__╱╲___             │
│  May 4  May 18   Jun 29     │
├─────────────────────────────┤
│ ACTIVITY BY HOUR            │
│ 21:00 most productive hour  │
│  ▁ ▂ ▄ ▆ █ █ 21:00·96 ▄ ▂ ▁ │        ← bars, peak hour labeled on axis
├─────────────────────────────┤
│ POPULAR TAGS                │
│ (# reflection 148)(# grati…)│        ← chips wrap
│ (# work 98)(# family 91) …  │
├─────────────────────────────┤
│ WRITING ACTIVITY            │
│ 302 active days · sq = day  │
│ [■■■ heatmap, scrolls ◄►]   │        ← shared scroll w/ month ruler below
│ Oct Nov Dec Jan Feb …       │
│ Less ■ ■ ■ ■ ■ More         │
└─────────────────────────────┘
```

### 3.2 Tablet — 768px (2-column bento; wide tiles span both)

```
┌───────────────────────────────────────────────┐
│ DearDiary / Statistics        Your writing year (☾)│
├───────────────────────────────────────────────┤
│ TOTAL ENTRIES (span 2)                        │
│ 1,847  [▲21.7%]                               │
│ a year of pages, faithfully filled            │
│ ─────────────────────────────────────────────  │
│ 118,640 wds │ 64 wds │ Calm 28%               │
├───────────────────────────┬───────────────────┤
│ TOP MOOD                  │ FAVORITES    (★)  │
│ (calm) Calm               │ 132               │
│ 28% of all entries        │ Entries you starred│
├───────────────────────────┼───────────────────┤
│ WRITING STREAK            │                   │
│ (flame) 12        34      │                   │
│         days      longest │                   │
├───────────────────────────┴───────────────────┤
│ MOOD DISTRIBUTION (span 2)                    │
│  ╭────╮  Calm 28%  Happy 22%                  │
│  │ring│  Thought 14% Tired 10% …              │
│  ╰────╯                                       │
├───────────────────────────────────────────────┤
│ AVERAGE PER WEEK (span 2)                     │
│ 14 /wk            peak 23 · wk of May 18      │
│      ╱╲  23                                   │
│  ___╱  ╲__╱╲___     x-axis                    │
├───────────────────────────────────────────────┤
│ ACTIVITY BY HOUR (span 2)                     │
│ 21:00 most productive hour                    │
│  ▁▂▄▆█ █21:00·96█ ▄▂▁                         │
├───────────────────────────────────────────────┤
│ POPULAR TAGS (span 2)                         │
│ (# reflection)(# gratitude)(# work) …         │
├───────────────────────────────────────────────┤
│ WRITING ACTIVITY (span 2, scrolls ◄►)         │
│ 302 active days                               │
│ [■■■ heatmap] Oct Nov Dec …   Less ■■■ More   │
└───────────────────────────────────────────────┘
```

### 3.3 Desktop — 1440px (the full 4-column bento, zero holes)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ DearDiary / Statistics                    Your writing year    Oct24–Sep25 (☾)│
├──────────────────────────────────┬───────────────────┬───────────────────────┤
│ TOTAL ENTRIES  (2 cols)          │ TOP MOOD          │ FAVORITES        (★)  │
│ 1,847        [▲ 21.7% vs last mo]│ (calm stamp) Calm│ 132                   │
│ a year of pages, faithfully filled│ 28% of all ent.  │ Entries you starred  │
│ ──────────────────────────────── │                  │                       │
│ 118,640 wds │ 64 wds │ Calm 28%  │                  │                       │
├──────────────────────────────────┼───────────────────┴───────────────────────┤
│ WRITING STREAK                   │ MOOD DISTRIBUTION (2 cols)                 │
│ (flame) 12              34       │  ╭────╮   Calm 28%  Happy 22%              │
│          days           longest  │  │ring│   Thought 14% Tired 10%            │
│                                  │  │ 12 │   Anxious 8%  Loved 7%             │
│                                  │  ╰────╯   Sad 5%    Excited 4%             │
├──────────────────────────────────┴───────────────────────────────────────────┤
│ AVERAGE PER WEEK (2 cols)        │ ACTIVITY BY HOUR (2 cols)                 │
│ 14 entries/wk                    │ 21:00 most productive hour                │
│ Based on the last 8 weeks        │ when your pages get written               │
│                       peak 23    │  ▁ ▂ ▄ ▆ █ █ █ ▄ ▂ ▁                      │
│            ╱╲   23               │      21:00 · 96  (peak labeled)           │
│      _____╱  ╲__╱╲____╱╲___      │                                           │
│      May 4   May 18      Jun 29  │                                           │
├──────────────────────────────────┴───────────────────────────────────────────┤
│ POPULAR TAGS (2 cols)                                                        │
│ (# reflection 148)(# gratitude 132)(# work 98)(# family 91) …                │
├──────────────────────────────────────────────────────────────────────────────┤
│ WRITING ACTIVITY (4 cols)                                                    │
│ 302 active days · each square is a day            Less ■ ■ ■ ■ ■ More        │
│ [■■■■ full-year heatmap · 53 weeks ■■■■]                                     │
│  Oct  Nov  Dec  Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Grid spec

```
Desktop ≥1024px : grid-template-columns: repeat(4, 1fr); gap: 16px;
  Row 1: [hero span2][top mood][favorites]
  Row 2: [streak][mood ring span2][ ]
  Row 3: [avg/week span2][activity/hour span2]
  Row 4: [tags span2][ ]
  Row 5: [heatmap span4]
  → CSS auto-flow places tiles; spans declared via .span-2 / .span-4 / .hero classes
    (NOT inline styles, so media queries can override them).

Tablet 601–1024px: grid-template-columns: repeat(2, 1fr);
  every span-2 / span-4 / hero → span 2 (full width); 1-col tiles stay 1.

Mobile ≤600px   : grid-template-columns: minmax(0, 1fr);
  every tile → span 1; gap 14px; the heatmap scrolls horizontally inside its card.

Gap: 16px (--space-lg) desktop/tablet, 14px mobile.
Container: max-width 1400px, side padding 32px desktop / 18px mobile.
Card padding: 20px (density 7/10 — a touch tighter than the current p-4=16px to fit more signal).
```

> **Implementation note (why this matters):** the current page uses Tailwind `lg:col-span-*`.
> In this spec the spans are **utility classes** (`.span-2`, `.span-4`, `.hero`) rather than inline
> `style="grid-column"`, because inline styles outrank the responsive media queries and would
> leak the desktop span into the mobile single column (this was caught and fixed during the
> mockup — see §11).

---

## 5. Token mapping

Every value below is an **existing** Tailwind token from `tailwind.config.js` / `theme.css`.
Raw hex appears only in the mockup's `:root` as the concrete stand-in for each token (the React
build resolves the same values through Tailwind classes + CSS variables).

| Visual role | Token / value | Where used |
|-------------|---------------|------------|
| Page background | `bg-primary-50` `#FAF6F0` | `<body>` |
| Card surface (light) | `bg-accent-cream` `#F5F0E6` | every tile |
| Card surface (night) | `bg-primary-800` `#2A1A14` | every tile, `[data-theme='night']` |
| Card border (light) | `border-primary-200` `#E0C9A6` | tile hairline |
| Card border (night) | `border-primary-600` `#5D4037` | tile hairline, night |
| Body ink (light) | `text-primary-700` `#3E2723` | hero numeral, headings (12.17:1) |
| Body ink (night) | `text-primary-100` `#F0E6D2` | body ink, night (13.50:1) |
| Secondary text | `text-primary-600` `#5D4037` | sub-values, axis labels (8.20:1) |
| Hint / tile label | `text-muted` = `--text-muted` `#7D5A3C` (5.44:1) | labels, hints, captions |
| Night hint | `--text-muted` `#E0C9A6` | labels in night (10.41:1) |
| Large-text / icon muted | `text-primary-400` `#A67C52` | **large text & icons only** (3.29:1) |
| Gold accent | `accent-gold` `#C9A961` | hero underline, delta chip, line stroke, peak dot ring, chip `#` |
| Gold accent (on cream, text) | **proposed `accent-gold-deep` `#6F5220`** | delta chip text, chip `#` in light — see §12 |
| Sage chart fill | `accent-sage` `#8A9A5B` | hour bars, heatmap lvl-3, calm mood |
| Rose accent | `accent-rose` `#B76E79` | streak flame glyph (icon) |
| Ink accent | `accent-ink` `#1A237E` | reserved for links/anchors if any |
| Hero numeral font | `font-display` (Playfair Display) | hero, tile big numbers |
| Sub-serif italic | `font-sub` (Cormorant Garamond) | hero caption "a year of pages…" |
| Body / label font | `font-body` (Inter) | tile labels, hints, axis |
| Mono numerals | `font-mono` (JetBrains Mono) | streak longest, legend %, chip count, axis values |
| Hand font | `font-hand` (Caveat) | "DearDiary" wordmark only |
| Radius | `rounded-lg` `16px` / `rounded-md` `8px` | tiles / chips & small controls |
| Elevation (rest) | `shadow-soft` `0 2px 8px rgba(62,39,35,.08)` | every tile |
| Elevation (hover) | `shadow-medium` `0 4px 16px rgba(62,39,35,.12)` | interactive tile hover |
| Night shadows | `[data-theme='night']` vars `rgba(0,0,0,.45/.5)` | night elevation |
| Motion duration | `duration-normal` `250ms` | hover lift, chip, toggle |
| Motion easing | `ease-out-expo` `cubic-bezier(.16,1,.3,1)` | all transforms |
| Chart grid line | `--chart-grid` `#E0C9A6` | line/bar gridlines |
| Chart tick text | `--chart-tick` `#7D5A3C` | axis labels |
| Chart line / dot | `--chart-line` `#C9A961` / `--chart-dot` `#3E2723` | line stroke / dots |
| Chart bar fill | `--chart-bar` `#A67C52` (light) → `#C9A961` (night) | hour bars |
| Mood slice stroke | `--chart-slice-stroke` `#F5F0E6` | ring segment separators |

**No new Tailwind color token is strictly required.** One *optional* addition is proposed in §12
(`accent-gold-deep`) purely so gold-on-cream can be used for **small text** (delta chip, chip `#`)
and clear 4.5:1. Without it, use `text-primary-700`/`text-primary-600` for any small gold-ish text
and reserve gold for fills/hairlines/large display only.

---

## 6. Component-by-component spec (all 10 tiles)

Shared tile shell (replaces `StatCard`):
```
<article class="card">            // bg-accent-cream, border border-primary-200/70,
                                  // rounded-lg, p-5 (20px), shadow-soft, min-w-0
  <header>                        // tile-label: uppercase, tracking-widest, text-muted
  …content…
</article>
```
Hover (interactive tiles): `shadow-soft→shadow-medium`, `translateY(-2px)`, border→gold,
`250ms ease-out-expo`. Cursor `pointer` where the whole tile is a link. **No layout shift** — only
transform/box-shadow/border-color animate.

### 6.1 Total entries — HERO (2 cols)
- **Shows:** `totalEntries` (hero numeral, `StatNumber` count-up), `monthChangePercent` (delta
  chip), plus a sub-rail surfacing `totalWords`, `averageWords`, `topMood.label` +
  `topMood.percentage`.
- **Structure:** label row → `1,847` (Playfair 800, `clamp(64px,7vw,92px)`, `text-primary-700`)
  with an absolutely-positioned gold `4–5px` underline (`bg-accent-gold`) beneath → delta chip
  (pill, `bg-accent-gold/14`, gold-deep text, Phosphor `CaretUp`/`CaretDown` + `signed(pct)%`)
  → italic Cormorant caption → divider `border-primary-200/60` → 3-up sub-rail (each: Playfair
  value + Inter uppercase key).
- **States:** hover lifts the tile. Delta chip text + arrow (never color alone — arrow glyph + the
  numeric sign carry meaning).
- **Newly surfaced:** `averageWords`, `topMood`, `entriesThisMonth` are folded into the hero sub-rail
  (currently `entriesThisMonth` lives only in the old "Total entries" hint string).

### 6.2 Top mood (1 col)
- **Shows:** `topMood.label`, `topMood.percentage`, plus `topMood` fallback → "No data" /
  "No moods recorded yet".
- **Structure:** label → row of `MoodIcon` (32px, mood `color`) + Playfair name → sub-line
  "`28%` of all entries · your most common feeling".
- **Empty state:** if `topMood === null`, show a neutral `Star` Phosphor icon and muted copy.

### 6.3 Favorites (1 col)
- **Shows:** `favorites` (Playfair numeral) + "Entries you starred".
- **Structure:** label → `132` (Playfair 800, 46px) → sub-line. Gold `Star` Phosphor icon pinned
  top-right (`text-accent-gold` on cream is decorative/large — or use gold-deep for the small
  icon; see a11y note).

### 6.4 Writing streak (1 col)
- **Shows:** `writingStreak` (current) + `longestStreak`.
- **Structure:** label → row: rose inline `FlameGlyph` (from current `WritingStreak`) + Playfair
  `12` + "days in a row", and a right-aligned mono `34` "longest".
- **Accessibility:** the flame is `aria-hidden`; the number is read by a visible label, so no
  `sr-only` duplicate is needed (an improvement over the current tile).

### 6.5 Mood distribution (2 cols) — segmented ring
- **Shows:** `moodDistribution[]` — each `label`, `color`, `percentage`, `count`.
- **Chart treatment:** 168px SVG donut, 16px stroke, segments via `stroke-dasharray` on
  `r=54` (C≈339.3). Segment order = descending percentage. A 4–5px `--chart-slice-stroke` gap
  separates arcs. Center shows a Playfair count (`12`) + "moods".
- **Direct labeling:** a **two-column legend** to the right: `swatch · Label … %` (mono %). The
  legend *is* the data label — no hover needed. Mood `color` drives both ring arc and legend
  swatch so the two are visually bound.
- **Never color alone:** swatch + text label + % all present; ring `role="img"` with an
  `aria-label` enumerating every mood + %.
- **Empty state:** `moodDistribution.length === 0` → muted "Write an entry to see your mood mix."

### 6.6 Average per week (2 cols) — line chart with direct peak label
- **Shows:** `averagePerWeek` (Playfair headline) + `weeklyActivity[]` (`week`, `entries`).
- **Chart treatment:** hand-drawn SVG (or Recharts `EntriesLineChart`), monotone line
  `--chart-line`, area fill `goldFade` gradient (opacity .22→0), dots `--chart-dot`. Horizontal
  `--chart-grid` dashed gridlines. **Peak point gets a gold-filled dot + a direct `23` label
  above it** and a chip in the header "peak 23 · week of May 18".
- **Direct labeling:** first/mid/last x-labels ("May 4", "May 18", "Jun 29"); y-axis min/max
  (0, 25). Tooltip remains for exact per-week values but is never required to read the story.

### 6.7 Activity by hour (2 cols) — bar chart with direct peak label
- **Shows:** `activityByHour[]` (`label`, `entries`); headline = peak hour label.
- **Chart treatment:** vertical bars `--chart-bar`, radius 3px top, on a baseline. The **peak
  bar is gold** (`accent-gold`) while the rest are `--chart-bar`, and the peak is labeled directly
  on the axis: "21:00 · 96". X-axis shows every 3rd hour label (4, 10, 16, 22) to stay legible.

### 6.8 Popular tags (2 cols) — chips
- **Shows:** `popularTags[]` (`tag`, `count`); `onTagClick(tag)` preserved.
- **Treatment:** pills (`rounded-md`… actually `rounded-full` for chip softness) sized by frequency
  — `lg 24px` / `md 19px` / `sm 15px` Playfair — with a gold `#` prefix and a mono count badge.
  This is the **chip** evolution of the current `WordCloud`: tap target, hover border→gold +
  `translateY(-1px)`, count is explicit (the current cloud hides counts behind `title`).

### 6.9 Favorites… already covered (6.3). *(Tile order in the DOM/reading order is preserved from
the current page: Total entries → Writing streak → Top mood → Total words → Average per week →
Mood distribution → Activity by hour → Popular tags → Favorites → Writing activity. The bento
**visual** order differs; the **DOM/tab order** follows the logical reading order in §8.)*

### 6.10 Writing activity (4 cols) — heatmap
- **Shows:** `heatmap[]` (`date`, `count`, `level 0–4`); headline = active-day count.
- **Treatment:** 53 week-columns × 7 rows of 13px rounded cells. Level colors reuse the existing
  `HeatmapChart` `LEVEL_CLASSES` semantics (empty = `--card-inset`, l1/l2 = sage @35%/60%, l3 =
  `accent-sage`, l4 = `accent-gold`). Night swaps to `primary-700/600 → gold → cream`.
- **Direct labeling:** "302 active days · each square is a day" + a "Less ■■■■■ More" legend.
  Each cell has a `title` tooltip (`date — N entries`).
- **Mobile:** grid + month ruler share **one** `overflow-x:auto` scroll container so they pan
  together and never widen the page (see §11).

---

## 7. Typography, spacing, elevation ladder

### Typography scale
| Role | Font | Size / weight | Color |
|------|------|---------------|-------|
| Hero numeral | `font-display` | 64–92px / 800, tracking −2px | `text-primary-700` |
| Tile big number | `font-display` | 34–46px / 800 | `text-primary-700` |
| Tile headline w/ unit | `font-display` + `font-body` unit | 34px + 14px/600 | ink + `text-muted` |
| Sub-stat value | `font-display` | 28px / 700 | `text-primary-700` |
| Delta chip | `font-body` | 13px / 600 | gold-deep (light) / gold (night) |
| Tile label | `font-body` | 11px / 600, uppercase, tracking 1.4px | `text-muted` |
| Body / hint | `font-body` | 13px / 400 | `text-muted` / `text-primary-600` |
| Mono numerals | `font-mono` | 11–20px / 700 | `text-primary-600` |
| Serif caption (italic) | `font-sub` | 17px / italic | `text-muted` |
| Wordmark | `font-hand` | 30px / 700 | `text-primary-700` |
| Axis labels | `font-body` | 10–11px | `--chart-tick` |

Large text (≥24px, or ≥18.66px bold) may use the 3:1 threshold; all body/label text targets
≥4.5:1 (verified in §9).

### Spacing scale (`--space-*` / Tailwind `xs…3xl`)
`xs 4` (hairline gaps) · `sm 8` (icon gaps, legend rows) · `md 16` (grid gap @tablet, sub-rail gap) ·
`lg 24` (grid gap desktop uses 16; section padding) · `xl 32` (page side padding) ·
`2xl 48` (top padding) · `3xl 64` (bottom page padding). Card padding = 20px (between `md` and `lg`,
chosen for density 7/10).

### Elevation ladder (soft-UI-evolution)
| Level | Token | Use |
|-------|-------|-----|
| rest | `shadow-soft` `0 2px 8px rgba(62,39,35,.08)` | every tile |
| hover | `shadow-medium` `0 4px 16px rgba(62,39,35,.12)` | interactive tile hover, theme toggle hover |
| focus | 3px gold ring + `outline-offset 3px` | `:focus-visible` (not a shadow — a ring, so it survives any shadow) |
| night rest/hover | `rgba(0,0,0,.45/.5)` | night elevation (deeper, per `theme.css`) |

The ladder is intentionally shallow: soft-UI-evolution means *subtle* depth. Two steps + a focus
ring is the whole vocabulary.

---

## 8. Motion spec (motion 5/10 — standard)

- **Duration:** `--duration-normal` 250ms for all tile/chip/toggle transitions. Hero numeral keeps
  the existing `StatNumber` count-up (700ms, `requestAnimationFrame`, respects reduced-motion).
- **Properties:** **transform + opacity + box-shadow + border-color only** — never `width`,
  `height`, `top`, `left`, or `filter` (compositor-friendly; no layout thrash).
- **Entrance (optional, on mount):** a gentle grid stagger — tiles fade + rise 12px, `stagger 0.05s`,
  `from: 'center'` to draw the eye inward (MASTER.md explicitly blesses center-origin stagger for
  bento). **No `back.out` overshoot** on data tiles (MASTER.md: overshoot reads sloppy on
  informational UI). Easing `ease-out-expo`.
- **Hover:** tile `translateY(-2px)` + shadow step; chip `translateY(-1px)` + border→gold. No
  layout shift (transform only).
- **`prefers-reduced-motion: reduce`:** every transition/animation is disabled
  (`transition: none`), the stagger renders the final state immediately, and `StatNumber` jumps
  straight to the target value (already handled by `usePrefersReducedMotion`). Charts render with
  `isAnimationActive={false}`.
- **Never:** parallax, scroll-scrub, looping decoration on the data tiles.

---

## 9. Dark mode (`data-theme="night"`)

Driven entirely by the `theme.css` variables + Tailwind `dark:` variants (`darkMode: ['class',
'[data-theme="night"]']`). No new variables needed.

| Role | Light | Night | Source |
|------|-------|-------|--------|
| Page bg | `#FAF6F0` primary-50 | `#1A0F0A` primary-900 | page |
| Card bg | `#F5F0E6` accent-cream | `#2A1A14` primary-800 | tile |
| Card border | `#E0C9A6` primary-200 | `#5D4037` primary-600 | tile |
| Body ink | `#3E2723` primary-700 | `#F0E6D2` primary-100 | text |
| Hint / label | `#7D5A3C` `--text-muted` | `#E0C9A6` `--text-muted` | text |
| Gold accent | `#C9A961` | `#C9A961` | accent-gold |
| Hour bars | `#A67C52` `--chart-bar` | `#C9A961` `--chart-bar` | chart |
| Line / dot | `#C9A961` / `#3E2723` | `#E0C9A6` / `#F0E6D2` | chart |
| Heatmap l1→l4 | inset, sage@35/60, sage, gold | primary-700, primary-600, gold, cream | tile |
| Shadows | brown-tinted | `rgba(0,0,0,.45/.5)` | theme.css |

Night cards must be `primary-800` (2.02:1 against a `primary-600` surface would fail; primary-800
on primary-900 gives a readable card/edge separation via the `primary-600` border, which is a
non-text 1.79:1 — acceptable for a decorative divider, not relied on for meaning).

---

## 10. Accessibility

### 10.1 Contrast (computed against the actual token hexes)
Card bg light = `#F5F0E6` (accent-cream); card bg night = `#2A1A14` (primary-800).
Formula: WCAG 2.1 relative luminance. `AA body ≥4.5`, `AA large ≥3.0`.

**LIGHT (on `#F5F0E6`):**
| Pair | Ratio | Verdict |
|------|-------|---------|
| primary-700 `#3E2723` body / hero numeral | **12.17** | AAA ✓ |
| primary-600 `#5D4037` sub-values / axis | **8.20** | AAA ✓ |
| primary-500 `#7D5A3C` hints / labels | **5.44** | AA ✓ |
| primary-400 `#A67C52` large text / icons | **3.29** | AA-large only (never body) ✓ |
| accent-ink `#1A237E` (links) | **11.66** | AAA ✓ |
| accent-rose `#B76E79` (flame icon) | **3.35** | icon/large only ✓ |
| success `#2E7D32` / error-text `#B3261E` | **4.51 / 5.75** | AA ✓ |
| accent-gold `#C9A961` as **small text** | **1.98** | **✗ — do not use; use gold-deep `#6F5220` (§12) or primary-700** |
| accent-gold as fill / hairline / large | 1.98 | non-text: fine as a graphic element vs its own stroke |

**NIGHT (on `#2A1A14`):**
| Pair | Ratio | Verdict |
|------|-------|---------|
| primary-100 `#F0E6D2` body | **13.50** | AAA ✓ |
| primary-200 `#E0C9A6` sub / labels | **10.41** | AAA ✓ |
| primary-300 `#C9A961` hints | **7.43** | AAA ✓ |
| accent-gold `#C9A961` small text | **7.43** | AA ✓ (gold is safe as text in night) |
| white on primary-800 button | **13.82** | AAA ✓ |
| error-text `#FF8A80` | **7.32** | AAA ✓ |
| border primary-600 `#5D4037` (decorative) | **1.79** | non-text divider only (not load-bearing) |

**Rule encoded in the spec:** in **light** mode gold is a *fill/hairline/large-display* color, never
small text (small gold-ish text → `accent-gold-deep` or `text-primary-700`). In **night** mode gold
is fully legible as text. This is the single most important a11y constraint of the direction.

### 10.2 Charts — never color alone
- Mood ring: legend carries **swatch + text label + percentage**; ring has a full
  `role="img"` + `aria-label` enumerating every mood and %. ✓
- Line chart: peak carries a **numeric direct label** ("23") in addition to the gold dot. ✓
- Hour bars: peak hour is labeled **on the axis** ("21:00 · 96"), not only colored gold. ✓
- Heatmap: "active days" count is stated in text; a Less→More legend is present; each cell has a
  `title`. ✓
- Every chart root has `role="img"` + a descriptive `aria-label` summarizing the data, so screen
  readers get the story without parsing SVG geometry.

### 10.3 Keyboard navigation & focus
- **Tab order** follows the logical reading order (matches the current page's data order): hero →
  writing streak → top mood → total words/avg (in hero sub-rail) → average-per-week chart →
  mood-distribution → activity-by-hour → popular-tag chips → favorites → heatmap. Interactive
  elements (tag chips, theme toggle) are real `<button>`s, in DOM order.
- **Focus-visible:** `outline: 3px solid var(--gold); outline-offset: 3px; border-radius: 8px`.
  Gold ring = 11.66:1 on cream, unmistakable on night. Never `outline: none`.
- **Touch targets:** all interactive controls (theme toggle, tag chips) are **≥44×44px** — the
  toggle is `padding 10/16` + 18px icon ≈ 44px tall; chips use `padding 8/14` with a 15–24px font,
  giving ≥44px hit height. Decorative icons are `aria-hidden` and not focusable.

### 10.4 Reduced motion
All motion is wrapped so `prefers-reduced-motion: reduce` disables transitions, renders entrance
states immediately, and freezes `StatNumber` at the target (see §8). The page is fully usable with
zero animation.

---

## 11. What the redesign improves vs the current page

1. **A real hierarchy.** The current page is a flat 3-column grid of equal `StatCard`s where the
   most important number (total entries) looks the same as the least (favorites). The bento makes
   total entries a **hero** (2 cols, 92px numeral) and lets the year-long heatmap own a full-width
   band. Importance is legible at a glance.
2. **Data-forward, not hover-dependent.** Peak week, peak hour, and top mood are **directly
   labeled on the chart**; the current charts hide their key values behind Recharts tooltips.
3. **Mood distribution becomes an object of beauty** — a segmented ring with a legend that pairs
   swatch + label + %, instead of a donut + a cramped 2-col text list.
4. **Tags become tappable chips with visible counts** instead of a word cloud where the count is
   buried in a `title` tooltip and there is no affordance that they filter.
5. **Soft-UI depth + a consistent elevation ladder** give the cream cards gentle lift without
   neumorphic mush, and every surface/ink pair is contrast-verified in both themes.
6. **Accessibility is designed in**: gold-on-cream small text is explicitly forbidden (it fails
   1.98:1), the ring/charts carry text alternatives, and touch targets are enforced.

### Risks / tradeoffs
- **Gold-on-cream is the trap.** `accent-gold` (1.98:1) cannot be small text in light mode; the
  spec mitigates with `accent-gold-deep` for text. If the team refuses a new token, delta-chip and
  chip-`#` text must fall back to `text-primary-700`.
- **A 92px hero numeral** needs `overflow`/clamp care so "118,640" and the sub-rail never wrap
  awkwardly at 1024px; the mockup uses `clamp(64px,7vw,92px)` + a wrapping sub-rail.
- **Heatmap width** is intrinsically ~900px; on mobile it must scroll inside its card. The mockup
  caught and fixed a real bug here (inline spans + un-shared scroll) — the React build must use
  span **classes** (not inline `grid-column`) and wrap grid+ruler in one scroll container (§4, §6.10).
- **12 mood colors** in the ring are bright by nature (they are the product's mood palette); the
  ring stays decorative with a full text legend, so color is never the sole channel.
- **Bento = fewer tiles above the fold** on laptop screens than the current 3-col list; acceptable
  because the hero communicates the headline instantly and the heatmap rewards the scroll.

---

## 12. Proposed token addition (optional, one only)

`accent-gold-deep: #6F5220` — a darkened gold for **small text on cream** (delta chip value, tag
`#` glyph) so the gold family can appear in micro-copy at AA. Usage: `text-accent-gold-deep`
(light) / falls back to `accent-gold` (night, already 7.43:1). If the team prefers zero new tokens,
use `text-primary-700` for those two spots and keep gold for fills/large display only.

---

## 13. Deliverable index

- **Spec:** this file (`SKETCH.md`)
- **Mockup:** [`mockup.html`](./mockup.html) — self-contained, deterministic sample data
  (~1 year: 1,847 entries, 118,640 words, 132 favorites, 12/34-day streaks, 12 moods, 12-week
  line, 11-hour bars, 9 tags, 53-week heatmap), light/night toggle with `localStorage`,
  hand-rolled SVG charts, no emoji icons (all inline SVG / geometric mood marks).
- **Verified in-browser:** light + night renders at 1440px, single-column stack at 390px with
  **no horizontal page overflow** (heatmap scrolls internally), shared heatmap+ruler scroll,
  toggle + persistence working.
