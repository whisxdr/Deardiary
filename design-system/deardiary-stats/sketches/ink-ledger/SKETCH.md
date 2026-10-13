# The Archivist's Ledger — DearDiary Stats Sketch

> **Designer A** · Direction: *The Archivist's Ledger* · Dials: variance 4/10 · motion 3/10 · density 6/10
> Companion mockup: [`mockup.html`](./mockup.html) (self-contained, light/night toggle)
> Status: build-ready spec. Every visual value maps to an **existing** project token unless a new token is explicitly proposed below.

---

## 1. Concept

**"The ledger an archivist keeps beside the diary."**

DearDiary is already a book; the stats page should feel like the *record* of that book — a ruled
ledger page, kept by hand, with a red margin rule down the left, ruled lines behind each row, and
numbered entries (01–10) like a real account book. The redesign leans fully into the leather-bound
identity:

- A **two-column ledger sheet**: a narrow left margin for **handwritten notes** (Caveat) and the
  entry number, and the main column for the value.
- Each statistic is a **ledger row** (`01 Total entries … 1,847`), not a floating card — the page
  reads as one continuous sheet of paper rather than ten separate tiles.
- **Ink-stamp moods**: the top mood is a circular, slightly-rotated double-ringed "stamp" in the
  diary's ink-blue (`accent-ink` / `--mood-stamp-ink`), like a seal pressed into the page.
- **Index-tab chapter dividers** ("The Habit / The Feelings / The Rhythm / The Archive") group the
  rows, like the tabs on a ledger's section pages.
- Numbers are set in **Playfair Display** (the ledger's pen) with **JetBrains Mono** for the entry
  numbers, percentages and counts (the archivist's precise hand).
- A **footnote in Caveat** at the bottom, exactly as a ledger would carry one.

The result is unmistakably a diary product — data, but written by hand.

---

## 2. Layout — one ruled sheet, not a card grid

The current page is ten equal `StatCard`s in a 3-column grid. This direction replaces that with a
**single ruled ledger sheet** whose rows are laid out as `label-column | body-column`, grouped under
index tabs. The red margin rule and faint horizontal ruled lines are the structure.

| Section (tab) | Rows (current tiles) |
|---------------|----------------------|
| **The Habit** | Total entries · Writing streak · Top mood · Total words · Average per week |
| **The Feelings** | Mood distribution |
| **The Rhythm** | Activity by hour |
| **The Archive** | Popular tags · Favorites · Writing activity |

> In the mockup all rows sit on one continuous sheet for a faithful "one book" read; in the React
> build each tab can optionally filter/paginate the sheet, but the default is the full page.

---

## 3. ASCII wireframes

### 3.1 Mobile — 375px (margin collapses to a note above each row)

```
┌─────────────────────────────────────┐
│ DearDiary                 (☾)       │   Caveat wordmark + toggle
│ Folio No. 2025 · Statistics Ledger  │
│ Your writing year                   │   Playfair h1
│ Oct 2024 – Sep 2025                 │   Cormorant italic
│ ═══════════════════════════════════ │   2px ink rule
│ [The Habit][Feelings][Rhythm][Arch] │   index tabs (scroll)
├─────────────────────────────────────┤
│ 01   TOTAL ENTRIES                 │
│      1,847  [▲21.7%]               │   Playfair + gold delta chip
│      142 this month                │
│ ─────────────────────────────────── │
│ ↳ every page you turned            │   Caveat margin note (moves here)
│ ─────────────────────────────────── │
│ 02   WRITING STREAK                │
│      🔥 12 days   34 longest        │
│ ↳ don't break the chain            │
│ ─────────────────────────────────── │
│ 03   TOP MOOD                      │
│      ⬤(stamp) Calm 28%              │   ink stamp
│ ↳ the feeling you reach for        │
│ ─────────────────────────────────── │
│ 04   TOTAL WORDS                   │
│      118,640 words · 64 avg        │
│ ─────────────────────────────────── │
│ 05   AVERAGE PER WEEK              │
│      14 · last 8 weeks             │
│        ╱╲  23                      │   line chart, peak labeled
│   ───╱  ╲──╱╲──                    │
│ ─────────────────────────────────── │
│ 06   MOOD DISTRIBUTION             │
│      Calm      28%  ▓▓▓▓           │   ledger bar list
│      Happy     22%  ▓▓▓            │
│      Thoughtful 14% ▓▓             │
│      … (12 moods)                  │
│ ─────────────────────────────────── │
│ 07   ACTIVITY BY HOUR              │
│      ▁▂▄▆█ █96█ ▄▂▁   21:00 peak   │
│ ─────────────────────────────────── │
│ 08   POPULAR TAGS                  │
│      (# reflection 148)(#gratitude…)│   chips
│ ─────────────────────────────────── │
│ 09   FAVORITES              ★       │
│      132                           │
│ ─────────────────────────────────── │
│ 10   WRITING ACTIVITY              │
│      302 active days · sq = day    │
│      [■■■ heatmap, scrolls ◄►]     │
│      Less ■■■■■ More               │
├─────────────────────────────────────┤
│ * tallied from entries in this      │   Caveat footnote
│   browser.                         │
└─────────────────────────────────────┘
```

### 3.2 Tablet — 768px (margin rule visible, rows keep label|body)

```
┌───────────────────────────────────────────────────────────┐
│ DearDiary  Folio No. 2025      Your writing year   Oct24–Sep25 (☾) │
│ ═══════════════════════════════════════════════════════════ │
│ [The Habit][The Feelings][The Rhythm][The Archive]         │
├──────────┬────────────────────────────────────────────────┤
│ 01       │ TOTAL ENTRIES                                  │
│ ↳ every  │ 1,847  [▲21.7% vs last month]  142 this month │
│  page    │ ──────────────────────────────────────────────  │
│  you     │ 02  WRITING STREAK                             │
│  turned  │ 🔥 12 days in a row        34 longest          │
│ ─────────┼────────────────────────────────────────────────┤
│ 03       │ TOP MOOD        ⬤(stamp) Calm · 28% of entries │
│ ↳ the    │ ──────────────────────────────────────────────  │
│  feeling │ 04  TOTAL WORDS   118,640 words · 64/entry avg │
│  you     │ ──────────────────────────────────────────────  │
│  reach   │ 05  AVERAGE PER WEEK  14 · last 8 weeks        │
│  for     │        ╱╲  23                                 │
│ ─────────┼────────────────────────────────────────────────┤
│ 06       │ MOOD DISTRIBUTION                              │
│ ↳ the    │ Calm 28% ▓▓▓▓  Happy 22% ▓▓▓  …               │
│  weather │ ──────────────────────────────────────────────  │
│  of your │ 07  ACTIVITY BY HOUR  ▁▂▄▆█ █21:00·96█ ▄▂▁    │
│  year    │ ──────────────────────────────────────────────  │
│ ─────────┼────────────────────────────────────────────────┤
│ 08       │ POPULAR TAGS                                   │
│ ↳ threads│ (#reflection 148)(#gratitude 132)(#work 98)…   │
│  you     │ ──────────────────────────────────────────────  │
│  return  │ 09  FAVORITES  132  ★ entries you starred      │
│  to      │ ──────────────────────────────────────────────  │
│ ─────────┼────────────────────────────────────────────────┤
│ 10       │ WRITING ACTIVITY  302 active days              │
│ ↳ the    │ [■■■ heatmap · 53 weeks ■■■] Oct Nov Dec …     │
│  whole   │ Less ■ ■ ■ ■ ■ More                            │
│  year    │                                                │
└──────────┴────────────────────────────────────────────────┘
```

### 3.3 Desktop — 1440px (wide sheet, ruled margin column fixed at 132px)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ DearDiary · Folio No. 2025                 Your writing year    Oct 24–Sep 25 (☾)│
│ ════════════════════════════════════════════════════════════════════════════════ │
│ [The Habit][The Feelings][The Rhythm][The Archive]────────────────────────────── │
├──────────────┬──────────────────────────────────────────────────────────────────┤
│ 01           │ 01  TOTAL ENTRIES                                                │
│ ↳ every page │     1,847   [▲21.7% vs last month]   142 entries this month      │
│   you turned │ ──────────────────────────────────────────────────────────────── │
│   ↳ a year   │ 02  WRITING STREAK                                               │
│   of them    │     🔥 12 days in a row                    34 longest streak     │
│ ─────────────┼──────────────────────────────────────────────────────────────────┤
│ 02           │ 03  TOP MOOD                                                      │
│ ↳ don't      │     ⬤ STAMP   Calm    28% of all entries · your most common       │
│   break the  │ ──────────────────────────────────────────────────────────────── │
│   chain      │ 04  TOTAL WORDS      118,640 words · 64 words per entry          │
│ ─────────────┼──────────────────────────────────────────────────────────────────┤
│ 03           │ 05  AVERAGE PER WEEK   14 entries · last 8 weeks                  │
│ ↳ the        │              ╱╲   23                                            │
│   feeling    │        ─────╱  ╲──╱╲───     Apr 6   May 18   Jun 22               │
│   you reach  │ ──────────────────────────────────────────────────────────────── │
│   for        │ 06  MOOD DISTRIBUTION                                            │
│ ─────────────┼     Calm 28% ▓▓▓▓▓   Happy 22% ▓▓▓▓   Thoughtful 14% ▓▓▓         │
│ 04           │     Tired 10% ▓▓      Anxious 8% ▓▓    Loved 7% ▓▓              │
│ ↳ ink spent  │     Sad 5% ▓  Excited 4% ▓  Cool 1%  Mindblown 1%  Angry 0  Ad…  │
│   ↳ word by  │ ──────────────────────────────────────────────────────────────── │
│   word       │ 07  ACTIVITY BY HOUR   21:00 most productive hour                 │
│ ─────────────┼     ▁ ▂ ▄ ▆ █ █ █21:00·96█ ▄ ▂ ▁   4  10  16  22               │
│ 05           │ ──────────────────────────────────────────────────────────────── │
│ ↳ a steady   │ 08  POPULAR TAGS                                                │
│   hand       │     (#reflection 148)(#gratitude 132)(#work 98)(#family 91)…     │
│   ↳ week by  │ ──────────────────────────────────────────────────────────────── │
│   week       │ 09  FAVORITES   132  ★   entries you starred                     │
│ ─────────────┼──────────────────────────────────────────────────────────────────┤
│ 06           │ 10  WRITING ACTIVITY   302 active days · each square is a day     │
│ ↳ the        │     [■■■■■■ full-year heatmap · 53 weeks ■■■■■■]                 │
│   weather of │      Oct  Nov  Dec  Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep   │
│   your year  │      Less ■ ■ ■ ■ ■ More                                        │
│ ─────────────┼──────────────────────────────────────────────────────────────────┤
│ 07           │                                                                │
│ ↳ when the   │                                                                │
│   pen moves  │                                                                │
│   ↳ evening, │                                                                │
│   mostly     │                                                                │
│ ─────────────┼──────────────────────────────────────────────────────────────────┤
│ 08           │                                                                │
│ ↳ threads    │                                                                │
│   you return │                                                                │
│   to         │                                                                │
│ ─────────────┼──────────────────────────────────────────────────────────────────┤
│ 09 · 10      │  * every figure tallied from entries kept in this browser.        │
│ ↳ the        │                                                                │
│   keepers    │                                                                │
└──────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 4. Grid spec

```
Desktop ≥1024px : ledger-grid: grid-template-columns: 132px 1fr;  (margin col fixed)
  .sheet  = one cream card, border 1px primary-200, radius 12px, shadow-soft
  ::before = 2px red margin rule at left:132px (opacity .55)
  ::after  = repeating horizontal ruled lines every 34px (opacity .16)
  .lrow   = grid-template-columns: 200px 1fr; gap 18px; padding 15px 0; min-height 68px
  each row: bottom hairline border-primary-soft

Tablet 720–1024px: margin col stays 132px; .lrow label col narrows to 180px.

Mobile ≤720px    : margin col collapses (rule hidden); .lrow becomes single column
  (label on top, body below); margin note moves above its row as a Caveat line.

Container: max-width 1180px; side padding 32px desktop / 16px mobile.
Row padding: 15px vertical; label col 200px; gap 18px.
Ruled-line pitch: 34px (matches a real ledger / legal pad).
```

> **Implementation note:** the ruled lines and margin rule are the sheet's `::before`/`::after`
> pseudo-elements, so they never affect layout or add DOM. The margin column is a real CSS grid
> column (`132px 1fr`), not a padding offset, so the red rule stays aligned to it at every width.

---

## 5. Token mapping

Every value is an **existing** token from `tailwind.config.js` / `theme.css`. Raw hex appears in the
mockup's `:root` only as the concrete stand-in (the React build resolves the same values via
Tailwind classes + CSS variables).

| Visual role | Token / value | Where used |
|-------------|---------------|------------|
| Page background | `bg-primary-50` `#FAF6F0` | `<body>` |
| Ledger sheet surface | `bg-accent-cream` `#F5F0E6` | `.sheet` |
| Ruled line | `border-primary-200` `#E0C9A6` @16% | `::after` repeating gradient |
| Margin rule | **`#D98A7E`** (soft ledger red — see §12) | `.sheet::before` |
| Sheet border | `border-primary-200` `#E0C9A6` | `.sheet` |
| Body ink | `text-primary-700` `#3E2723` | numerals, headings (12.17:1) |
| Secondary ink | `text-primary-600` `#5D4037` | margin notes, sub-values (8.20:1) |
| Row label | `text-muted` `#7D5A3C` (5.44:1) | `.lrow .name` |
| Entry number / mono | `text-primary-400` `#A67C52` (large/icon ok) or `text-muted` | `.num`, percentages |
| Gold accent | `accent-gold` `#C9A961` | delta chip, line stroke, favorites star, peak |
| Gold small text | **proposed `accent-gold-deep` `#6F5220`** | chip text, tag `#` (see §12) |
| Ink stamp | `accent-ink` `#1A237E` / `--mood-stamp-ink` | mood stamp ring + text |
| Streak flame | `accent-rose` `#B76E79` | flame glyph (icon) |
| Chart grid / line | `--chart-grid` `#E0C9A6` / `--chart-line` `#C9A961` | line chart |
| Chart bar / heat l4 | `--chart-bar` `#A67C52` / `accent-sage` `#8A9A5B` | hour bars, heatmap |
| Display font | `font-display` (Playfair Display) | all big numerals |
| Serif italic | `font-sub` (Cormorant Garamond) | hints, captions |
| Body / label | `font-body` (Inter) | row labels, axis |
| Mono | `font-mono` (JetBrains Mono) | entry numbers, %, counts |
| Hand | `font-hand` (Caveat) | margin notes, wordmark, footnote |
| Radius | `rounded-lg` 16px sheet / `rounded-sm` 4px swatches | sheet / chips |
| Elevation | `shadow-soft` | `.sheet`; hover on tabs/chips → `shadow-medium` |
| Motion duration | `duration-normal` 250ms / `duration-fast` 150ms | chip/tab hover |

**New tokens proposed (both optional, one is shared with Designer B):** `accent-gold-deep #6F5220`
(small gold text on cream) and `ledger-rule #D98A7E` (the red margin rule). Without them: use
`text-primary-700` for small gold-ish text and `border-primary-400` for the margin rule.

---

## 6. Component-by-component spec (all 10 rows)

Shared ledger sheet shell (replaces the `StatCard` grid):
```
<section class="sheet">                    // bg-accent-cream, border primary-200, rounded-lg, shadow-soft
  <div class="ledger-grid">                // grid 132px 1fr; ::before red rule; ::after ruled lines
    <div class="gutter"><span class="num">01</span><p class="margin-note">…Caveat…</p></div>
    <div class="content">
      <div class="lrow">                    // label col 200px | body col 1fr; hairline bottom
        <div class="lbl"><span class="num">01</span><span class="name">Total entries</span></div>
        <div class="body">…</div>
      </div>
    </div>
  </div>
</section>
```

### 6.1 Row 01 — Total entries
- **Shows:** `totalEntries`, `monthChangePercent` (delta chip), `entriesThisMonth`.
- **Structure:** label col → body: Playfair `1,847` (44px/800) + gold delta chip
  (`▲ 21.7% vs last month`, arrow + sign, never color alone) + Cormorant hint
  "142 entries this month".
- **Newly surfaced:** `entriesThisMonth` moves out of the old hint string into a visible figure.

### 6.2 Row 02 — Writing streak
- **Shows:** `writingStreak`, `longestStreak`.
- **Structure:** rose inline `FlameGlyph` + Playfair `12` + "days in a row" (Cormorant italic) +
  right-aligned mono `34` "longest streak".
- **A11y:** flame is `aria-hidden`; the number is read by its visible label — no `sr-only` duplicate
  (an improvement over the current tile, which wraps the value in `sr-only`).

### 6.3 Row 03 — Top mood (ink stamp)
- **Shows:** `topMood.label`, `topMood.percentage`, `topMood.mood` (icon), `topMood.color`.
- **Structure:** a 76px circular **ink stamp** — double `border: 3px double var(--stamp-ring)`,
  rotated `-7deg`, `color: var(--mood-stamp-ink)`. Inside: tiny "STAMP" eyebrow, a geometric mood
  mark, the mood name (Playfair 15px), and the `%` (mono). Beside it a Cormorant hint
  "28% of all entries · your most common feeling".
- **A11y:** stamp carries `aria-label="Top mood: Calm, 28 percent of all entries"`; the mood color
  is decorative, the name + % carry the meaning.
- **Empty:** `topMood === null` → muted "No moods recorded yet".

### 6.4 Row 04 — Total words
- **Shows:** `totalWords`, `averageWords`.
- **Structure:** Playfair `118,640` + italic `words` unit + hint "64 words per entry on average".

### 6.5 Row 05 — Average per week (line chart)
- **Shows:** `averagePerWeek`, `weeklyActivity[]`.
- **Chart:** hand-drawn SVG monotone line, `--chart-line` gold stroke 2.4px, dashed `--chart-grid`
  gridlines. **Peak point** = gold dot + ink ring + a direct mono `23` label above it. X labels:
  first / peak / last ("Apr 6", "May 18", "Jun 22"). Tooltip optional, never required.
- **Direct labeling:** headline value `14 entries · last 8 weeks` in the label column.

### 6.6 Row 06 — Mood distribution (ledger bar list)
- **Shows:** `moodDistribution[]` (`label`, `color`, `percentage`, `count`).
- **Chart:** a ledger-style list, one row per mood: `swatch · Name … bar … %` (mono). The bar is
  the mood `color` at full opacity on a `--rule` track. Descending percentage. This is deliberately
  **not** a pie/donut — a ledger records rows, and a bar list reads every value exactly.
- **A11y:** swatch + text label + `%`; the whole list is `role="img"` with an `aria-label`
  enumerating the distribution. Never color alone.

### 6.7 Row 07 — Activity by hour (bar chart)
- **Shows:** `activityByHour[]`; headline = peak hour.
- **Chart:** vertical bars `--chart-bar` (sage) rounded 3px; the **peak bar is gold** and labeled
  directly with its value (`96`) above it; axis shows every 3rd hour (4, 10, 16, 22). Peak hour
  also stated in text: "21:00 most productive hour".

### 6.8 Row 08 — Popular tags (ink index chips)
- **Shows:** `popularTags[]`; `onTagClick(tag)` preserved as real `<button>`s.
- **Structure:** pills with a gold `#` prefix, the tag name, and a mono count badge — the count is
  explicit (the current `WordCloud` hides it in a `title`). Hover: border→gold + `translateY(-1px)`.

### 6.9 Row 09 — Favorites
- **Shows:** `favorites`.
- **Structure:** Playfair `132` + a gold star (large icon) + "entries you starred".

### 6.10 Row 10 — Writing activity (heatmap)
- **Shows:** `heatmap[]` (`date`, `count`, `level 0–4`); headline = active-day count.
- **Chart:** 53 week-columns × 7 rows of 13px rounded cells. Level colors reuse the existing
  `HeatmapChart` semantics: empty = `border-soft`, l2/l3 = sage @45%/70%, l4 = `accent-sage`,
  l5 = `accent-gold`. Month ruler above. "Less ■■■■■ More" legend. Each cell `title` = date + count.
- **Mobile:** the grid scrolls horizontally inside its row (one `overflow-x:auto` container shared
  with the month ruler) so the page never widens.

---

## 7. Typography, spacing, depth

### Typography scale
| Role | Font | Size / weight | Color |
|------|------|---------------|-------|
| Wordmark | `font-hand` | 34px / 700 | `text-primary-700` |
| Page h1 | `font-display` | 34px / 700 | `text-primary-700` |
| Folio meta | `font-mono` | 11px, uppercase, tracking 1px | `text-muted` |
| Row label | `font-body` | 12px / 600, uppercase, tracking 1.2px | `text-muted` |
| Row numeral | `font-display` | 44px / 800 | `text-primary-700` |
| Sub-value | `font-display` + `font-sub` unit | 44px + italic 18px | ink + `text-muted` |
| Hint / caption | `font-sub` italic | 16–17px | `text-muted` |
| Mono numerals | `font-mono` | 11–20px / 700 | `text-primary-600` |
| Margin note | `font-hand` | 21px / 600 | `text-primary-600` @85% |
| Entry number | `font-mono` | 12px | `text-primary-400` |
| Axis labels | `font-body` | 10px | `--chart-tick` |

### Spacing
`xs 4` (num gaps) · `sm 8` (icon gaps) · `md 16` (body gaps) · `lg 24` (row body gap) ·
`xl 32` (page side) · row padding 15px vertical · gutter 132px · label col 200px. Density 6/10 —
airy but structured, like a ledger with room to write.

### Depth
Intentionally minimal — paper is flat. One elevation level (`shadow-soft`) on the sheet; tabs and
chips lift to `shadow-medium` on hover. No card-per-tile shadows; the *ruled lines* are the
structure, not drop shadows.

---

## 8. Motion spec (motion 3/10 — restrained)

- **Duration:** `--duration-fast` 150ms for chip/tab hover; `--duration-normal` 250ms for the theme
  toggle. `StatNumber` keeps the existing 700ms count-up (respects reduced-motion).
- **Properties:** **transform + opacity + box-shadow + border-color only.** Never width/height/top.
- **Hover:** tag chip `translateY(-1px)` + border→gold; tab `shadow-medium`. No layout shift.
- **Entrance:** none by default (a ledger page is simply *there*). Optional: the sheet fades in once
  with `fade-slide` 250ms. Under reduced-motion, everything renders in final state.
- **Stamp:** a single subtle 250ms rotate-in on first view of row 03 (optional, skippable).

---

## 9. Dark mode (`data-theme="night"`)

Driven by `theme.css` variables + Tailwind `dark:`. No new variables required.

| Role | Light | Night |
|------|-------|-------|
| Page | `#FAF6F0` primary-50 | `#1A0F0A` primary-900 |
| Sheet | `#F5F0E6` accent-cream | `#2A1A14` primary-800 |
| Ruled line / border | `#E0C9A6` primary-200 | `#5D4037` primary-600 |
| Margin rule | `#D98A7E` | `#A15B52` (softened) |
| Body ink | `#3E2723` primary-700 | `#F0E6D2` primary-100 |
| Row label / hint | `#7D5A3C` | `#C9A961` primary-300 |
| Ink stamp | `#1A237E` accent-ink | `#D9CBB0` `--mood-stamp-ink` (night) |
| Gold | `#C9A961` | `#C9A961` |
| Chart line / bars | `#C9A961` / `#A67C52` | `#E0C9A6` / `#C9A961` |
| Shadows | brown-tinted | `rgba(0,0,0,.45)` |

Night keeps the ledger metaphor: darker paper, lighter ink, the stamp flips to a light ink so it
stamps legibly on dark paper (exactly as `theme.css` already does for `--mood-stamp-ink`).

---

## 10. Accessibility

### 10.1 Contrast (computed against actual token hexes)
Sheet bg light = `#F5F0E6`; sheet bg night = `#2A1A14`. WCAG 2.1 relative luminance.

**LIGHT (on `#F5F0E6`):**
| Pair | Ratio | Verdict |
|------|-------|---------|
| primary-700 `#3E2723` numerals / headings | **12.17** | AAA ✓ |
| primary-600 `#5D4037` margin notes / sub | **8.20** | AAA ✓ |
| primary-500 `#7D5A3C` labels / hints | **5.44** | AA ✓ |
| primary-400 `#A67C52` entry numbers / large icons | **3.29** | AA-large only (never body) ✓ |
| accent-ink `#1A237E` stamp text | **11.66** | AAA ✓ |
| accent-rose `#B76E79` flame (icon) | **3.35** | icon/large only ✓ |
| accent-gold `#C9A961` small text | **1.98** | **✗ — use `accent-gold-deep` `#6F5220` (≈5.9:1) or primary-700** |
| ledger-rule `#D98A7E` (margin rule) | 2.9:1 | decorative rule only, never carries meaning ✓ |

**NIGHT (on `#2A1A14`):**
| Pair | Ratio | Verdict |
|------|-------|---------|
| primary-100 `#F0E6D2` numerals | **13.50** | AAA ✓ |
| primary-200 `#E0C9A6` margin notes | **10.41** | AAA ✓ |
| primary-300 `#C9A961` labels / gold text | **7.43** | AAA ✓ |
| `--mood-stamp-ink` `#D9CBB0` stamp | **11.2** | AAA ✓ |

**Encoded rule:** gold is a *fill / hairline / large-display* color in light mode, never small text
(→ `accent-gold-deep` or `primary-700`); gold is fully legible as text in night. The red margin
rule is decorative only.

### 10.2 Charts — never color alone
- Mood list: swatch + text label + `%` on every row; list is `role="img"` with a full `aria-label`. ✓
- Line chart: peak carries a **numeric direct label** (`23`) + the gold dot. ✓
- Hour bars: peak bar is labeled with its value (`96`) and the peak hour is stated in text. ✓
- Heatmap: active-day count in text, Less→More legend, per-cell `title`. ✓
- Ink stamp: `aria-label` carries the mood + `%`; color is decorative. ✓

### 10.3 Keyboard & focus
- **Tab order** follows the ledger's reading order (rows 01→10), matching the current page's data
  order. Interactive elements (tag chips, theme toggle, tabs) are real `<button>`s in DOM order.
- **Focus-visible:** `outline: 3px solid var(--gold); outline-offset: 3px`. Never `outline: none`.
- **Touch targets:** tag chips `padding 8/14` + 13–14px font → ≥44px hit height; theme toggle
  `padding 10/16` → ~44px. Decorative icons (`aria-hidden`) are not focusable.

### 10.4 Reduced motion
All transitions disabled; `StatNumber` jumps to target; the optional stamp rotate-in and sheet
fade-in render immediately. The page is fully usable with zero animation.

---

## 11. What the redesign improves vs the current page

1. **One continuous object.** Ten floating cards become a single ruled ledger sheet — the page
   finally *is* a page of the diary, not a dashboard bolted onto it.
2. **Handwritten character.** Caveat margin notes beside every row give each number a human
   annotation ("every page you turned", "don't break the chain") — warmth the current flat cards
   can't express.
3. **Mood as an artifact.** The top mood becomes a rotated ink stamp (using the product's own
   `--mood-stamp-ink`), a small piece of craft instead of a label + icon.
4. **Exact-readable mood data.** The ledger bar list shows every mood's `%` and count precisely,
   versus the current donut + cramped text list.
5. **Numbers stay honest.** Entry numbers (01–10), mono percentages and counts read like a real
   account book; the index tabs group the page into chapters.

### Risks / tradeoffs
- **Ruled lines must stay faint** (opacity ~.16) or they fight the text; too strong and the ledger
  reads as graph paper.
- **The margin column costs horizontal space** (132px) — on a 1440px desktop that's fine, on tablet
  it narrows the body; on mobile it collapses to a note above each row.
- **A ledger bar list is less "glanceable" than a donut** for mood split; the tradeoff buys exact
  readability and fits the metaphor. If the team prefers a ring, see Designer B.
- **The red margin rule** is decorative and low-contrast by design; it must never be the only
  signal for anything (it isn't — labels and numbers carry all meaning).
- **Fewer "cards" above the fold** on a laptop than the current 3-col grid; the ledger's continuous
  scroll is intentional and reads faster once you're in it.

---

## 12. Proposed token additions (both optional)

1. `accent-gold-deep: #6F5220` — small gold text on cream (delta chip value, tag `#`). Same proposal
   as Designer B; reuse the same token if either direction ships. Falls back to `text-primary-700`.
2. `ledger-rule: #D98A7E` — the soft red margin rule (decorative). Falls back to `border-primary-400`.

If the team prefers zero new tokens: use `text-primary-700` for small gold-ish text and
`border-primary-400` for the margin rule.

---

## 13. Deliverable index

- **Spec:** this file (`SKETCH.md`)
- **Mockup:** [`mockup.html`](./mockup.html) — self-contained, deterministic sample data (~1 year:
  1,847 entries, 118,640 words, 132 favorites, 12/34-day streaks, 12 moods, 8-week line, 8-hour
  bars, 8 tags, 53-week heatmap), light/night toggle with `localStorage`, hand-rolled SVG charts,
  no emoji icons (all inline SVG / geometric mood marks).
