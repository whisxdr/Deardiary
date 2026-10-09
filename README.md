# DearDiary

An offline-first digital diary that feels like opening a leather-bound book. Write entries, pick a mood, tag the day, then read it back as a two-page spread with a real page-flip.

Everything is stored in the browser. No account, no server, no tracking.

## Requirements

- Node.js 24, or Node 22.18+ (the `npm test` suites import TypeScript directly, which needs
  Node's type-stripping support)
- npm 9 or newer

## Setup

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

The diary starts empty. Write your first entry, or import a JSON backup from Settings → Data.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check with `tsc` then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Run the TypeScript compiler in check-only mode |
| `npm run lint:emoji` | ESLint, including the rules that keep Unicode emoji out of the UI |
| `npm test` | Run the pure-Node suites (CSP parity, week buckets, export parsing) |

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Leather cover, daily quote, "Open the Book" |
| `/dashboard` | Search, filter, sort and browse every entry |
| `/write` and `/write/:id` | Rich text editor with autosave and a details sidebar |
| `/entry/:id` | Two-page reader with drop cap and page-flip navigation |
| `/calendar` | Month grid with mood dots and a per-day detail panel |
| `/stats` | Totals, streaks, mood split, charts and tag cloud |
| `/settings` | Profile, appearance, privacy, data, about |

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `Ctrl+S` | Save the current entry |
| `Ctrl+B` / `Ctrl+I` | Bold / italic in the editor |
| `Ctrl+Enter` | Publish the entry |
| `Esc` | Close the editor or a dialog |
| `←` / `→` | Previous / next entry in the reader |

## Tech stack

- React 18, Vite 5, TypeScript 5 (strict)
- Tailwind CSS 3.4 with a custom book theme
- Zustand for entries and settings state
- Tiptap for the rich text editor
- Framer Motion for page flips, ink drops and the cover parallax
- Recharts for the statistics charts
- sonner for toasts, uuid for ids
- jsPDF and html2canvas for PDF export

## Architecture

The codebase is split by responsibility so no file grows into a "fat file":

- `src/pages/` — composition only, each page under 100 lines
- `src/components/` — presentational components grouped by domain (`ui`, `book`, `entry`, `editor`, `calendar`, `stats`, `charts`, `layout`, `common`)
- `src/hooks/` — one hook per file, all reusable behaviour
- `src/services/` — storage, statistics, export and import logic
- `src/store/` — Zustand slices for entries, settings and UI state
- `src/lib/` — low-level helpers (storage wrapper, formatting, parsing, validation)
- `src/utils/` — pure functions with no side effects
- `src/constants/` — moods, quotes, routes, storage keys, limits, editor config
- `src/types/` — shared TypeScript interfaces

Folders that expose a public surface (`components/*`, `hooks`, `lib`, `utils`, `constants`, `store`, `types`) have an `index.ts` barrel; page folders do not, because each page is imported by its own path. Imports use the `@/` alias.

## Icon System

The UI contains no Unicode emoji. Every glyph is a vector, so it inherits color, scales cleanly, and renders identically across platforms.

**Custom mood icons** — the twelve moods in `src/components/mood/icons/` are hand-drawn SVG "ink stamps": a shared 24x24 viewBox, 1.5px stroke, round caps, and `currentColor` for the stroke so each call site can tint them. `MoodIcon` dispatches on the mood id, so components never import a specific icon file:

```tsx
import { MoodIcon, MoodBadge, MoodPickerGrid } from '@/components/mood';

<MoodIcon mood="calm" size={20} color="#8A9A5B" />
<MoodBadge mood="excited" />
<MoodPickerGrid value={mood} onChange={setMood} />
```

Mood colors live only in `src/constants/moods.ts`. The picker reads them from there, so adding a mood means adding one entry plus one icon file.

**UI icons** use [Phosphor Icons](https://phosphoricons.com) via `@phosphor-icons/react`. Sizes are set per call site in pixels, and weight signals state: `regular` by default, `fill` when active.

**Avatars** come from [DiceBear](https://dicebear.com) in the `lorelei` style, seeded by a string the user picks in Settings. Because that is a network request, `Avatar` falls back to local initials when the request fails, so the diary still works offline.

**Accessibility** — decorative icons carry `aria-hidden="true"`; icon-only buttons carry an `aria-label`; mood stamps expose the mood name to screen readers through `MoodBadge`.

**Keeping emoji out** — `.eslintrc.json` enables `no-restricted-syntax` rules that fail on emoji in string literals, JSX text, and template strings. To audit manually:

```bash
grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" src --include=*.ts --include=*.tsx
```

## Data and privacy

- Entries live in `localStorage` under the `deardiary:` namespace.
- Export a JSON backup from Settings → Data, and import it back on another device.
- Single entries export as PDF, Markdown or plain text from the reader.
- Clearing browser storage deletes the diary, so keep backups.
- Nothing leaves the browser on its own. The only outbound request is the optional
  DiceBear avatar fetch, which falls back to local initials when it fails.

## Accessibility

- Semantic landmarks, ARIA labels on icon-only controls and live regions for save state.
- Full keyboard navigation, including visible focus rings and a skip link.
- Colour contrast targets WCAG 2.1 AA.
- `prefers-reduced-motion` disables page flips, gold dust and count-up animations.

## License

MIT
