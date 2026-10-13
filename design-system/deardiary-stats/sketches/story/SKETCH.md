# A Year in Pages — DearDiary Stats Sketch

> **Designer C** · Direction: *A Year in Pages* (scroll-triggered storytelling) · Dials: variance 8/10 · motion 6/10 · density 4/10
> Companion mockup: [`mockup.html`](./mockup.html) (self-contained, light/night toggle)
> Status: build-ready spec. Every visual value maps to an **existing** project token unless a new token is explicitly proposed below.

---

## 1. Concept

**"The diary writes back about your habits."**

A stats page is usually a wall of numbers. This direction treats it as a **short story the diary
tells you about your own year** — read top to bottom like a book, in four chapters. The MASTER.md
"Scroll-Triggered Storytelling" pattern is the foundation:

- A **cover / intro hook**: "A Year in Pages — Your diary kept a record of you. Here's what it
  noticed." with a scroll cue.
- A **bookmark progress ribbon** across the top (a gold gradient fill + a Caveat ribbon with a live
  `%`) — the reading position, styled as a diary bookmark.
- **Four chapters**, each with its own accent from the warm palette:
  - **Chapter I · The Habit** (gold) — total entries, writing streak, total words, favorites.
  - **Chapter II · The Feelings** (rose) — mood distribution as a segmented ring.
  - **Chapter III · The Rhythm** (sage) — average per week line, activity-by-hour bars.
  - **Chapter IV · The Archive** (leather) — year heatmap + popular tags.
- Each chapter opens with a **chapter number + rule**, a big Playfair title with an italic accent
  word, a Cormorant lede, and a **pull-quote in Caveat** that narrates the data
  ("You wrote on 302 of the last 365 days." / "You're a night writer — 21:00 is your most
  productive hour.").
- **Progressive reveal**: rows fade + rise as you scroll (IntersectionObserver), staggered.
- A **climax CTA** ("The next page is blank. → Write an entry").

The result is emotional rather than analytical — the numbers become sentences.

---

## 2. Chapter outline — which stat lives where, and the narrative copy

| Chapter | Accent | Tiles (current) | Lede | Pull-quote |
|---------|--------|----------------|------|------------|
| **I · The Habit** | `--ch-habit` gold | Total entries · Writing streak · Total words · Favorites | "Before anything else: you showed up. Again and again, a page at a time." | "You wrote on 302 of the last 365 days." |
| **II · The Feelings** | `--ch-feel` rose | Mood distribution | "Each entry carried a mood. Together they're a portrait of your inner weather." | "Calm was your most common feeling — 28% of everything you wrote." |
| **III · The Rhythm** | `--ch-rhythm` sage | Average per week · Activity by hour | "When do the pages get written? The diary knows the hours you keep." | "You're a night writer — 21:00 is your most productive hour." |
| **IV · The Archive** | `--ch-archive` leather | Popular tags · Writing activity (heatmap) | "A whole year, one square per day — and the threads you kept returning to." | "302 active days. Reflection is the thread you pull most." |

> Pull-quotes are computed from real data in the React build (e.g. top-mood label + %, peak hour,
> active-day count) so the narrative is always truthful; the mockup hardcodes plausible values.

---

## 3. ASCII wireframes

### 3.1 Mobile — 375px (single column, chapters stack, ribbon on top)

```
┌─────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← progress ribbon (gold gradient fill)
│                            ┌──┐(☾)  │ ← bookmark ribbon w/ % + theme toggle
├─────────────────────────────────────┤
│         DearDiary                   │   Caveat wordmark
│      A Year in Pages                │   Playfair h1 (clamp 38–58px)
│  Your diary kept a record of you.   │   Cormorant italic
│      SCROLL TO READ IT  ⌄           │   scroll cue (bobs)
├─────────────────────────────────────┤
│ CHAPTER I ─────────────────────     │   gold rule
│ The Habit                           │
│ ↳ you showed up, a page at a time   │
│ "You wrote on 302 of the last 365." │   Caveat pull-quote
│ ┌─────────────────────────────────┐ │
│ │ TOTAL ENTRIES                   │ │
│ │ 1,847  [▲21.7% vs last month]   │ │
│ │ 142 this month · faithfully…    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ WRITING STREAK                  │ │
│ │ 🔥 12 days    34 longest        │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ TOTAL WORDS  118,640 words      │ │
│ │ 64 words per entry              │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ FAVORITES  132  the keepers     │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ CHAPTER II ────────────────────     │   rose rule
│ The Feelings                        │
│ "Calm — 28% of everything."         │
│ ┌─────────────────────────────────┐ │
│ │ MOOD DISTRIBUTION               │ │
│ │      ╭────╮   Calm   28%        │ │
│ │      │ring│   Happy   22%       │ │   ring + legend (stacks on mobile)
│ │      │ 12 │   Thoughtful 14%    │ │
│ │      ╰────╯   Tired   10%  …    │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ CHAPTER III ───────────────────     │   sage rule
│ The Rhythm                          │
│ "You're a night writer — 21:00."    │
│ ┌─────────────────────────────────┐ │
│ │ AVERAGE PER WEEK  14 · 8 weeks  │ │
│ │      ╱╲  23                     │ │
│ │  ───╱  ╲──╱╲──    peak 23       │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ ACTIVITY BY HOUR                │ │
│ │ ▁▂▄▆█ █21:00·96█ ▄▂▁            │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ CHAPTER IV ────────────────────     │   leather rule
│ The Archive                         │
│ "302 active days. Reflection."      │
│ ┌─────────────────────────────────┐ │
│ │ WRITING ACTIVITY  302 active    │ │
│ │ [■■■ heatmap, scrolls ◄►]       │ │
│ │ Less ■■■■■ More                 │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ POPULAR TAGS                    │ │
│ │ (#reflection 148)(#gratitude…)  │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│      The next page is blank.        │   climax CTA
│   Your story isn't finished —       │
│      [ + Write an entry ]           │
│ * tallied from entries in browser.  │
└─────────────────────────────────────┘
```

### 3.2 Tablet — 768px (2-up tiles within chapters)

```
┌───────────────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓ progress ribbon ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                       ┌──┐(☾)             │
├───────────────────────────────────────────────────────────┤
│                 DearDiary                                  │
│              A Year in Pages                               │
│        Your diary kept a record of you.   SCROLL ⌄         │
├───────────────────────────────────────────────────────────┤
│ CHAPTER I ────────────────────────────────                 │
│ The Habit                                                  │
│ ↳ you showed up, a page at a time                          │
│ "You wrote on 302 of the last 365 days."                   │
│ ┌───────────────────────────┬───────────────────────────┐ │
│ │ TOTAL ENTRIES             │ WRITING STREAK            │ │
│ │ 1,847 [▲21.7%]            │ 🔥 12 days      34 long   │ │
│ │ 142 this month            │                           │ │
│ ├───────────────────────────┼───────────────────────────┤ │
│ │ TOTAL WORDS  118,640      │ FAVORITES  132            │ │
│ │ 64 words/entry            │ the pages you starred     │ │
│ └───────────────────────────┴───────────────────────────┘ │
├───────────────────────────────────────────────────────────┤
│ CHAPTER II ──────────────────────────────  (rose)          │
│ The Feelings                                               │
│ "Calm — 28% of everything you wrote."                      │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ MOOD DISTRIBUTION                                     │ │
│ │  ╭────╮   Calm 28%   Happy 22%   Thoughtful 14%       │ │
│ │  │ring│   Tired 10%   Anxious 8%   Loved 7%  …        │ │
│ │  ╰────╯                                               │ │
│ └───────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────┤
│ CHAPTER III ─────────────────────────────  (sage)          │
│ The Rhythm                                                 │
│ "You're a night writer — 21:00 is your peak."              │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ AVERAGE PER WEEK  14 · last 8 weeks                   │ │
│ │        ╱╲  23                                         │ │
│ │  ─────╱  ╲──╱╲───    peak 23 · wk of May 18           │ │
│ └───────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ ACTIVITY BY HOUR   ▁▂▄▆█ █21:00·96█ ▄▂▁               │ │
│ └───────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────┤
│ CHAPTER IV ──────────────────────────────  (leather)       │
│ The Archive                                                │
│ "302 active days. Reflection is your thread."              │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ WRITING ACTIVITY  302 active days · sq = day          │ │
│ │ [■■■■ 53-week heatmap ■■■■]  Oct Nov Dec …  Less■■More │ │
│ └───────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ POPULAR TAGS  (#reflection 148)(#gratitude 132)…      │ │
│ └───────────────────────────────────────────────────────┘ │
├───────────────────────────────────────────────────────────┤
│            The next page is blank.                         │
│      [ + Write an entry ]                                 │
└───────────────────────────────────────────────────────────┘
```

### 3.3 Desktop — 1440px (airy 2-up, centered column, generous margins)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ progress ribbon ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                                          ┌────┐  (☾ Night)    │
├────────────────────────────────────────────────────────────────────────────────┤
│                              DearDiary                                          │
│                           A Year in Pages                                       │
│              Your diary kept a record of you. Here's what it noticed.           │
│                         SCROLL TO READ IT  ⌄                                    │
│                                                                                │
│   CHAPTER I ────────────────────────────────────────────────                   │
│   The Habit                                                                     │
│   ↳ Before anything else: you showed up. Again and again, a page at a time.    │
│   "You wrote on 302 of the last 365 days."                                     │
│   ┌────────────────────────────────┬────────────────────────────────┐         │
│   │ TOTAL ENTRIES                  │ WRITING STREAK                 │         │
│   │ 1,847  [▲21.7% vs last month]  │ 🔥 12 days in a row   34 long  │         │
│   │ 142 entries this month         │                                │         │
│   ├────────────────────────────────┼────────────────────────────────┤         │
│   │ TOTAL WORDS                    │ FAVORITES                      │         │
│   │ 118,640 words · 64/entry       │ 132 · the pages you starred    │         │
│   └────────────────────────────────┴────────────────────────────────┘         │
│                                                                                │
│   CHAPTER II ────────────────────────────────────────────  (rose)               │
│   The Feelings                                                                 │
│   "Calm was your most common feeling — 28% of everything you wrote."           │
│   ┌────────────────────────────────────────────────────────────────────────┐  │
│   │ MOOD DISTRIBUTION                                                      │  │
│   │  ╭────╮   Calm 28%    Happy 22%    Thoughtful 14%    Tired 10%         │  │
│   │  │ring│   Anxious 8%  Loved 7%     Sad 5%          Excited 4%    …     │  │
│   │  │ 12 │                                                                │  │
│   │  ╰────╯                                                                │  │
│   └────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│   CHAPTER III ───────────────────────────────────────────  (sage)               │
│   The Rhythm                                                                   │
│   "You're a night writer — 21:00 is your most productive hour."                │
│   ┌────────────────────────────────────────────────────────────────────────┐  │
│   │ AVERAGE PER WEEK · 14 entries · last 8 weeks                           │  │
│   │              ╱╲   23                                                   │  │
│   │        ─────╱  ╲──╱╲───      peak 23 · week of May 18                  │  │
│   └────────────────────────────────────────────────────────────────────────┘  │
│   ┌────────────────────────────────────────────────────────────────────────┐  │
│   │ ACTIVITY BY HOUR · when your pages get written                         │  │
│   │ ▁ ▂ ▄ ▆ █ █ █21:00·96█ ▄ ▂ ▁      21:00 · 96 · your peak              │  │
│   └────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│   CHAPTER IV ───────────────────────────────────────────  (leather)             │
│   The Archive                                                                  │
│   "302 active days. Reflection is the thread you pull most."                   │
│   ┌────────────────────────────────────────────────────────────────────────┐  │
│   │ WRITING ACTIVITY · 302 active days · each square is a day              │  │
│   │ [■■■■■■■■ 53-week heatmap ■■■■■■■■]  Oct Nov Dec … Sep  Less■■■■■■More  │  │
│   └────────────────────────────────────────────────────────────────────────┘  │
│   ┌────────────────────────────────────────────────────────────────────────┐  │
│   │ POPULAR TAGS · tap a thread to filter                                  │  │
│   │ (#reflection 148)(#gratitude 132)(#work 98)(#family 91)(#travel 64)…   │  │
│   └────────────────────────────────────────────────────────────────────────┘  │
│                                                                                │
│                    The next page is blank.                                     │
│              Your story isn't finished — add today's entry.                    │
│                       [ + Write an entry ]                                     │
│              * every figure tallied from entries in this browser.              │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Grid / layout spec

```
Page: max-width 1080px, centered; side padding 32px desktop / 16px mobile; bottom 140px.
Chapters: margin-top 70px between them; each is a full-width <section id="ch-*">.

Progress ribbon: position fixed top:0; height 5px; .fill width 0→100% (gradient across the
  four chapter accents). Bookmark: fixed top:5px right:26px; a 46px gold ribbon with a Caveat
  live %, notched bottom edge (CSS ::before/::after triangles).

Tiles within a chapter: display grid; grid-template-columns repeat(2, 1fr); gap 20px.
  .tile.wide → span 2 (full width). Mobile ≤720px → single column, .wide → span 1.

Tile: bg-accent-cream, border 1px primary-200, radius 16px, shadow-soft, padding 26px (density
  4/10 — airy). Chapter accent drives the tile-label underline / hover border via --ch-accent.

Chapter heading: .ch-head = [CHAPTER N] —— gold/sage/rose rule; .ch-title Playfair 28–40px with
  an italic accent word; .ch-lede Cormorant 20px; .ch-pull Caveat 26px.
```

> **Accent scoping:** each chapter sets a local `--ch-accent` (`#ch-habit { --ch-accent: … }`) so
> every child (rule, title accent, pull-quote, hover border, peak chip) picks up its chapter's
> color automatically — one variable per chapter, no per-element overrides.

---

## 5. Token mapping

All values are **existing** project tokens; chapter accents reuse the warm palette.

| Visual role | Token / value | Where used |
|-------------|---------------|------------|
| Page background | `bg-primary-50` `#FAF6F0` | `<body>` |
| Tile surface | `bg-accent-cream` `#F5F0E6` | `.tile` |
| Tile border | `border-primary-200` `#E0C9A6` | `.tile` |
| Body ink | `text-primary-700` `#3E2723` | big numbers, chapter titles (12.17:1) |
| Secondary ink | `text-primary-600` `#5D4037` | ledes, sub-values (8.20:1) |
| Label / hint | `text-muted` `#7D5A3C` | tile labels, hints (5.44:1) |
| Chapter I accent | `accent-gold` `#C9A961` | gold rule, habit hover, ribbon |
| Chapter II accent | `accent-rose` `#B76E79` | rose rule, feelings hover |
| Chapter III accent | `accent-sage` `#8A9A5B` | sage rule, rhythm hover, hour bars |
| Chapter IV accent | `primary-400` `#A67C52` (leather) | archive rule, tag hover |
| Gold small text | **proposed `accent-gold-deep` `#6F5220`** | peak chip, tag `#` (see §11) |
| Streak flame | `accent-rose` `#B76E79` | flame glyph (icon) |
| Display font | `font-display` (Playfair) | big numbers, chapter titles |
| Serif italic | `font-sub` (Cormorant) | ledes, captions, pull accents |
| Body / label | `font-body` (Inter) | tile labels, axis, CTA |
| Mono | `font-mono` (JetBrains) | peak values, counts, ribbon % |
| Hand | `font-hand` (Caveat) | wordmark, pull-quotes, bookmark |
| Radius | `rounded-lg` 16px tile / `rounded-full` chips | tile / chips & CTA |
| Elevation | `shadow-soft` rest / `shadow-medium` hover | tile / interactive hover |
| Motion duration | `duration-normal` 250ms / `duration-slow` 400ms (reveal 600ms) | hover / scroll reveal |
| Motion easing | `ease-out-expo` `cubic-bezier(.16,1,.3,1)` | all transforms/reveals |
| Chart grid / line | `--chart-grid` / `--chart-line` `#E0C9A6`/`#C9A961` | line chart |
| Chart bar / heat | `--chart-bar` `#A67C52` / `accent-sage` `#8A9A5B` / `accent-gold` | hour bars, heatmap |

**One optional new token:** `accent-gold-deep #6F5220` (small gold text on cream — same as Designers
A & B; reuse the same token if any direction ships). Without it, `text-primary-700` for those spots.

---

## 6. Component-by-component spec

### 6.1 Cover (intro hook)
- **Shows:** the page title, product wordmark, date range, scroll cue.
- **Structure:** Caveat "DearDiary" wordmark → Playfair h1 "A Year in Pages" (`clamp(38px,6vw,58px)`)
  → Cormorant italic sub → "SCROLL TO READ IT" with a bobbing chevron (transform/opacity only).
- **Motion:** chevron bobs 2s infinite; disabled under reduced-motion.

### 6.2 Progress ribbon + bookmark
- **Shows:** live scroll `%`.
- **Structure:** a fixed 5px top bar whose `.fill` width tracks `scrollTop / (scrollHeight-clientHeight)`;
  a gold bookmark ribbon (notched via CSS triangles) carries the `%` in mono + a Caveat label.
- **A11y:** ribbon is `aria-hidden` (decorative); it never obscures focus (it sits at the very top,
  offset from content; focus-visible outlines use `outline-offset` so they stay visible).

### 6.3 Chapter heading
- **Shows:** chapter number, rule, title, lede, pull-quote.
- **Structure:** `CHAPTER N` (mono, accent) + a flex rule → Playfair title with one italic accent
  word → Cormorant lede → Caveat pull-quote. Each is its own `.reveal` element with staggered
  delays (90/180/270ms).
- **Pull-quote copy** is computed from real data in the React build.

### 6.4 Tile — Total entries (Ch. I)
- **Shows:** `totalEntries`, `monthChangePercent`, `entriesThisMonth`.
- **Structure:** label → Playfair `1,847` → gold delta chip (`▲ 21.7% vs last month`, arrow+sign) →
  Inter sub "142 entries this month · a year of pages, faithfully filled."
- **Hover:** tile lifts (`translateY(-3px)`), border→chapter accent.

### 6.5 Tile — Writing streak (Ch. I)
- **Shows:** `writingStreak`, `longestStreak`.
- **Structure:** rose `FlameGlyph` + Playfair `12` + "days in a row" + right-aligned mono `34`
  "longest streak". Flame `aria-hidden`; number read by visible label (no `sr-only`).

### 6.6 Tile — Total words (Ch. I)
- **Shows:** `totalWords`, `averageWords`. Playfair `118,640` + italic `words` unit + "64 words per
  entry on average."

### 6.7 Tile — Favorites (Ch. I)
- **Shows:** `favorites`. Playfair `132` + "the pages you starred to keep."

### 6.8 Tile — Mood distribution (Ch. II, wide) — segmented ring
- **Shows:** `moodDistribution[]` (`label`, `color`, `percentage`, `count`).
- **Chart:** a 172px SVG donut, 18px stroke, `r=70` (C≈439.8), segments via `stroke-dasharray`
  with a 4px gap, descending percentage, each arc in its mood `color`. Center = Playfair count
  (`12`) + "moods".
- **Legend:** a right-hand list pairing `swatch · Label … %` (mono) — the ring + legend are bound by
  color, but the legend carries all meaning in text.
- **A11y:** ring is `role="img"` with an `aria-label` enumerating every mood + %; never color alone.

### 6.9 Tile — Average per week (Ch. III, wide) — line + area
- **Shows:** `averagePerWeek`, `weeklyActivity[]`.
- **Chart:** monotone line `--chart-line` 2.6px + a gold area fill (opacity .14) + dashed gridlines.
  **Peak** = gold dot (ink ring) + direct mono `23` label above; chip "peak 23 · week of May 18".

### 6.10 Tile — Activity by hour (Ch. III, wide) — bars
- **Shows:** `activityByHour[]`; peak hour.
- **Chart:** vertical bars, sage @.68 opacity, **peak bar gold** + direct value label (`96`) above;
  axis every 3rd hour. Chip "21:00 · 96 entries · your peak".

### 6.11 Tile — Writing activity (Ch. IV, wide) — heatmap
- **Shows:** `heatmap[]` (`date`, `count`, `level 0–4`); active-day count.
- **Chart:** 53 week-columns × 7 rows of 13px cells; levels reuse `HeatmapChart` semantics
  (empty = `border-soft`, l2/l3 = sage @45%/70%, l4 = `accent-sage`, l5 = `accent-gold`); month
  ruler above; "Less ■■■■■ More" legend; per-cell `title`.
- **Mobile:** grid + ruler share one `overflow-x:auto` container; the page never widens.

### 6.12 Tile — Popular tags (Ch. IV, wide) — chips
- **Shows:** `popularTags[]`; `onTagClick(tag)` as real `<button>`s.
- **Structure:** pills with gold `#` prefix + tag + mono count. Hover: border→archive accent +
  `translateY(-2px)`.

### 6.13 Climax CTA
- **Shows:** a closing invitation.
- **Structure:** Playfair "The next page is blank." → Cormorant italic → a gold pill button
  "[＋ Write an entry]" (navigates to `ROUTES.write`). Caveat footnote "* every figure tallied from
  entries kept in this browser."

---

## 7. Typography, spacing, depth

### Typography scale
| Role | Font | Size / weight | Color |
|------|------|---------------|-------|
| Wordmark | `font-hand` | 40px / 700 | `text-primary-700` |
| Cover h1 | `font-display` | 38–58px / 800, clamp | `text-primary-700` |
| Chapter title | `font-display` | 28–40px / 700 (italic accent word) | ink + chapter accent |
| Chapter number | `font-mono` | 13px / 700, tracking 1px | chapter accent |
| Lede | `font-sub` | 20px | `text-primary-600` |
| Pull-quote | `font-hand` | 26px / 600 | chapter accent |
| Tile big number | `font-display` | 46–64px / 800, clamp | `text-primary-700` |
| Tile label | `font-body` | 11px / 600, uppercase, tracking 1.6px | `text-muted` |
| Tile hint | `font-sub` italic | 17px | `text-muted` |
| Mono values | `font-mono` | 12–22px / 700 | `text-primary-600` |
| CTA button | `font-body` | 15px / 600 | `#FAF6F0` on gold-deep (light) / ink on gold (night) |

### Spacing (density 4/10 — airy)
`sm 8` (label gaps) · `md 16` (inline) · `lg 24` (tile internal) · `xl 32` (page side) ·
chapter `margin-top 70px` · tile gap 20px · tile padding 26px · cover padding 40/56px ·
bottom 140px (room for the CTA to breathe). Deliberately spacious — this is the editorial direction.

### Depth
Soft-UI: tiles `shadow-soft` → `shadow-medium` + `translateY(-3px)` on hover (300ms). The ribbon and
bookmark are the only "chrome"; everything else is paper + ink.

---

## 8. Motion spec (motion 6/10 — standard-plus, but reduced-motion-safe)

- **Reveal:** each `.reveal` starts `opacity:0; translateY(22px)` and transitions to visible
  (600ms, `ease-out-expo`) when an **IntersectionObserver** fires at `threshold 0.15`. Staggered
  within a chapter via `transition-delay` 90/180/270ms. Reveal fires **once** (observer unobserves).
- **Ribbon:** `.fill` width updates on scroll (`transition: width 120ms linear`, passive listener).
- **Hover:** tile `translateY(-3px)` + shadow step; chip `translateY(-2px)` + border→accent.
- **Properties:** **transform + opacity + box-shadow + border-color only.** No width/height/top.
- **Scroll cue:** chevron bobs (2s, transform only).

### `prefers-reduced-motion: reduce` (mandatory — this direction is scroll-heavy)
- **Every `.reveal` renders in its final visible state immediately** (`.reveal { opacity:1;
  transform:none }`) — chapters are fully readable with zero scroll effects.
- IntersectionObserver is skipped entirely (no observer attached) so nothing depends on scrolling.
- The scroll-cue bob, ribbon width transition, and all hover transitions are disabled.
- `StatNumber` count-up jumps straight to target; charts render with no animation.
- **Pause when hidden:** the IntersectionObserver naturally stops when a chapter is off-screen; no
  animation runs off-screen.

> This is the direction's biggest engineering obligation and it is fully handled: the *content* is
> the story, the *motion* is optional garnish. Without JS or with reduced-motion, the page is a
> complete, readable article.

---

## 9. Dark mode (`data-theme="night"`)

Driven by `theme.css` + Tailwind `dark:`. Chapter accents brighten for legibility on dark paper.

| Role | Light | Night |
|------|-------|-------|
| Page | `#FAF6F0` | `#1A0F0A` primary-900 |
| Tile | `#F5F0E6` | `#2A1A14` primary-800 |
| Border | `#E0C9A6` primary-200 | `#5D4037` primary-600 |
| Body ink | `#3E2723` | `#F0E6D2` primary-100 |
| Lede / sub | `#5D4037` primary-600 | `#E0C9A6` primary-200 |
| Label / hint | `#7D5A3C` | `#C9A961` primary-300 |
| Ch. I gold | `#C9A961` | `#C9A961` |
| Ch. II rose | `#B76E79` | `#D98A9A` (brightened) |
| Ch. III sage | `#8A9A5B` | `#A9B573` (brightened) |
| Ch. IV leather | `#A67C52` | `#C9A961` |
| CTA button | gold-deep bg / cream text | gold bg / ink text |
| Chart line / bars | `#C9A961` / `#A67C52` | `#E0C9A6` / `#C9A961` |
| Shadows | brown-tinted | `rgba(0,0,0,.45)` |

---

## 10. Accessibility

### 10.1 Contrast (computed against actual token hexes)
Tile bg light = `#F5F0E6`; tile bg night = `#2A1A14`.

**LIGHT (on `#F5F0E6`):**
| Pair | Ratio | Verdict |
|------|-------|---------|
| primary-700 `#3E2723` numbers / titles | **12.17** | AAA ✓ |
| primary-600 `#5D4037` ledes / sub | **8.20** | AAA ✓ |
| primary-500 `#7D5A3C` labels / hints | **5.44** | AA ✓ |
| accent-rose `#B76E79` pull-quote (26px) | **3.35** | AA-large (≥18.66px bold / ≥24px) ✓ |
| accent-sage `#8A9A5B` chapter III accent (title 28px+ / rule) | **3.0** | AA-large / non-text ✓ |
| accent-gold `#C9A961` pull-quote (26px) | **1.98** | **✗ as text — use `accent-gold-deep` for gold pull-quotes, or keep pull-quote in ink/rose** |
| accent-gold small text (peak chip, tag `#`) | **1.98** | **✗ — use `accent-gold-deep` `#6F5220`** |
| gold-deep `#6F5220` | **≈5.9** | AA ✓ |
| `#FAF6F0` on gold-deep CTA button | **≈12** | AAA ✓ |

> **Encoded rule:** the *chapter rule* and *hover borders* may use gold/sage/rose as non-text
> graphics (3:1). Any **gold text** (Chapter I pull-quote, peak chips, tag `#`) must use
> `accent-gold-deep` in light mode. Rose and sage are safe for large pull-quotes (≥24px) at 3:1.

**NIGHT (on `#2A1A14`):**
| Pair | Ratio | Verdict |
|------|-------|---------|
| primary-100 `#F0E6D2` numbers | **13.50** | AAA ✓ |
| primary-200 `#E0C9A6` ledes | **10.41** | AAA ✓ |
| primary-300 `#C9A961` labels / gold text | **7.43** | AAA ✓ |
| brightened rose `#D98A9A` / sage `#A9B573` | **≈5.5 / ≈4.6** | AA ✓ |
| ink on gold CTA | **≈12** | AAA ✓ |

### 10.2 Charts — never color alone
- Mood ring: legend pairs swatch + label + %; ring `role="img"` + full `aria-label`. ✓
- Line chart: peak carries numeric direct label `23` + gold dot; chip states the peak week. ✓
- Hour bars: peak bar labeled with value `96`; peak hour stated in text + chip. ✓
- Heatmap: active-day count in text, Less→More legend, per-cell `title`. ✓

### 10.3 Keyboard & focus
- **Tab order** follows the reading order: cover → Ch. I tiles → Ch. II ring/legend → Ch. III
  charts → Ch. IV heatmap/tags → CTA. All interactive elements (tag chips, CTA, theme toggle) are
  real `<button>`s in DOM order.
- **Focus-visible:** `outline: 3px solid var(--gold); outline-offset: 3px`. The fixed ribbon sits at
  the very top edge (5px) and the bookmark at `top:5px right:26px`; because focus uses
  `outline-offset` (not a covering shadow), a focused element's ring is never obscured by them.
- **Touch targets:** tag chips `padding 8/15` + 14px font → ≥44px; CTA `padding 14/28`; theme toggle
  ~44px. Decorative icons `aria-hidden`.

### 10.4 Reduced motion (see §8)
Fully handled — every chapter renders in final state; no observer; no scroll-scrub; no parallax.

---

## 11. What the redesign improves vs the current page

1. **It tells a story, not a spreadsheet.** The numbers become sentences ("You're a night writer"),
   turning passive data into a reflective, emotional read that fits a diary.
2. **Real hierarchy through narrative.** Four chapters group the ten stats by theme; the reader
   always knows "where they are" via the ribbon + chapter headings.
3. **A sense of progress & completion.** The bookmark ribbon and climax CTA give the page a
   beginning, middle, and end — the current flat grid has neither.
4. **The heatmap earns its place** as the wide base of Chapter IV, and the mood ring is introduced
   by a lede that explains what it means.
5. **Motion with a conscience.** The reveal choreography is genuinely pleasant *and* fully
   disabled under reduced-motion / no-JS — the content stands alone.

### Risks / tradeoffs
- **Longer page.** Four airy chapters + cover + CTA means more scrolling than the current
  one-screen grid; mitigated by the progress ribbon, but a power user who wants all numbers at a
  glance may prefer Designer A or B. The ribbon keeps them oriented.
- **Gold-on-cream text trap** (same as A & B): gold pull-quotes / chips need `accent-gold-deep` in
  light mode; the spec encodes this and the mockup uses gold-deep.
- **Scroll-driven reveal is the main complexity.** The IntersectionObserver must be robust and the
  reduced-motion path must be the *default* fallback, not an afterthought — both are specified.
- **Ring vs exact values.** The mood ring is beautiful but less exact than Designer A's ledger list;
  the legend carries every %, so exactness is preserved in text.
- **Pull-quotes must be truthful.** They're computed from data in the real build; a hardcoded mockup
  string would be a bug if the data changes. Flagged in §2.

---

## 12. Proposed token addition (optional, shared)

`accent-gold-deep: #6F5220` — small gold text on cream (Chapter I pull-quote, peak chips, tag `#`).
Identical to Designers A & B; **reuse one token** if any direction ships. Without it, gold pull-quotes
fall back to `text-primary-700` and chips to `text-primary-600`.

---

## 13. Deliverable index

- **Spec:** this file (`SKETCH.md`)
- **Mockup:** [`mockup.html`](./mockup.html) — self-contained, deterministic sample data (~1 year:
  1,847 entries, 118,640 words, 132 favorites, 12/34-day streaks, 12 moods, 6-point line, 8-hour
  bars, 8 tags, 53-week heatmap), light/night toggle with `localStorage`, IntersectionObserver
  reveals + progress ribbon, reduced-motion path, hand-rolled SVG charts, no emoji icons.
