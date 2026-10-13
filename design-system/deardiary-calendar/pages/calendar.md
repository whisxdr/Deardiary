# Calendar Page — Approved Direction

> **Status: APPROVED by the user on 2026-10-13.** This file is the authoritative build spec for
> `src/components/calendar/` and `src/pages/Calendar/`. It overrides `MASTER.md` for this page.
> **Chosen direction: A — Almanac Pages.**

---

## Decision

Of the four sketches produced (`../sketches/`), the user selected **Direction A — Almanac Pages**
and it has been **implemented** in the app.

- **Full spec:** [`../sketches/almanac/SKETCH.md`](../sketches/almanac/SKETCH.md)
- **Visual reference:** [`../sketches/almanac/mockup.html`](../sketches/almanac/mockup.html)
- Rejected for this page (kept for reference / possible later reuse):
  - **B — Mood Heat Grid**, **C — Torn Paper Wall**, **D — Diary Timeline**

## The idea in one line

The calendar becomes **a page from an old farmer's almanac**: a double-rule masthead with the month
in Playfair and the year in italic, a soft red margin rule down the left, a small-caps weekday
strip, ruled day boxes, and the day detail set as a marginal annotation.

## User's two stated requirements

1. **Colours must match the project.** Every value is an existing token from `tailwind.config.js` /
   `theme.css`. No new colour tokens were added; `accent-gold-deep` and `ledger-rule` already
   existed from the statistics work.
2. **Fonts must be readable for every user.** This overrides the sketch wherever the two disagree
   (see Deviations below).

## Non-negotiable rules when editing this page

1. **Font discipline.** Playfair (`font-display`) for *large* display text only — month title, date
   numerals, panel date, entry titles. Inter (`font-body`) for **all** small text: weekday strip,
   labels, counts, day notes, previews, buttons. JetBrains Mono (`font-mono`) for numerals and
   counts. Caveat (`font-hand`) for the single footer line only.
2. **No `font-sub` (Cormorant Garamond).** Its thin hairlines at small sizes were the eye-strain
   source the user reported on the statistics page; it is not used here at all.
3. **Contrast is math.** Body/label text ≥4.5:1, large text ≥3:1. Small text uses `primary-600`
   (8.20:1) or `primary-500` (5.44:1); gold **text** uses `accent-gold-deep` (6.37:1) and never raw
   `accent-gold` (1.98:1). Verified in both themes in-browser.
4. **Never colour alone.** Every cell's `aria-label` names its moods in words, the count is printed
   as text, and `CalendarMoodKey` names all 12 moods on the page.
5. **Don't break the build**: `npm run typecheck`, `npm test`, `npm run build` must all pass.
6. **Responsive at 375 / 768 / 1440px** with no horizontal overflow; the margin rule and the 152px
   inset collapse below `lg`.

## Implementation map

| File | Role |
|------|------|
| `src/pages/Calendar/Calendar.tsx` | The almanac page: `.almanac-page` wrapper + `lg:pl-[152px]` inset |
| `src/components/calendar/CalendarHeader.tsx` | Masthead — double rule, Playfair month + italic year, tick rule, nav |
| `src/components/calendar/CalendarWeekdays.tsx` | Small-caps strip; weekend days in italic |
| `src/components/calendar/CalendarGrid.tsx` | Closes the ruled outline; derives each day's note from its first tag |
| `src/components/calendar/CalendarCell.tsx` | The ruled day box — date, today pill, dots, count, note, quiet hairline |
| `src/components/calendar/CalendarMoodKey.tsx` | Names all 12 moods (new) |
| `src/components/calendar/CalendarDayDetail.tsx` | Annotation panel with a gold left border |
| `src/styles/globals.css` | `.almanac-page::before` — the red margin rule |

## Deviations from the sketch

- **Day notes are the entry's first tag** (`#rain`, `#books`), not the invented Caveat phrases in the
  mockup. There is no note field on `Entry`, and inventing copy would be dishonest. They render in
  Inter italic, and are **hidden below `sm`** where a cell is too narrow to read one without
  truncating to `tr...`.
- **No Caveat on the day notes.** The sketch used handwriting there; the user's readability
  requirement takes precedence, and the notes repeat across ~16 cells.
- **The mood key sits under the grid** rather than inside the day panel, so it explains the dots
  once for the page instead of repeating per selected day.

## Decisions log

- **2026-10-13** — Direction A chosen over B, C and D, then implemented in `src/`.
- **2026-10-13** — Font discipline imposed per the user's readability requirement: no `font-sub`,
  Caveat reduced to one footer line, day notes in Inter italic.

## Open questions for the user

- Should the day-detail panel sit **below** the grid (as built, matching the sketch) or **beside**
  it at `lg` (the previous layout)? Built below, per the approved mockup.
