# Performance and memory — round 3: first paint without JavaScript, less to hold

Date: 2026-10-12
Build: Vite 5 / React 18 / TypeScript 5
Method: local production build served with production headers (`scripts/serve-with-csp.mjs`), measured with Playwright under the same mobile profile as the earlier rounds (4x CPU, ~1.6 Mbps, 150 ms RTT). Both sides were built from this repository: the baseline is commit `586f514`, built and served on a second port, so every number below is the same machine, same link, same profile. Transfer is gzip.

## Summary

The complaint was a Lighthouse run on the deployed site: performance 90, FCP 1.8 s, LCP 3.0 s, speed index 4.7 s, plus a heading-order failure, and a request to cut memory without losing features.

The first paint used to wait for the bundle. It no longer does: `index.html` carries a static first frame of the opening screen and the whole stylesheet, both paint from the document. The opening screen itself stopped using Framer Motion, which took that library off the first load entirely. The dashboard now virtualizes sooner, and the two dialogs that pulled Framer Motion into pages that never open them are loaded on the click that does.

## Before / after, mobile profile

| Metric | Before | After | Delta |
|---|---|---|---|
| First contentful paint | 1 648 ms | **780 ms** | −53% |
| Largest contentful paint | 4 468 ms | **780 ms** | −83% |
| Load event | 3 465 ms | 2 515 ms | −27% |
| Requests | 28 | 19 | −32% |
| Transfer | 741 KB | 557 KB | −25% |
| JavaScript | 551 KB | 426 KB | −125 KB |
| Fonts | 151 KB | 87 KB | −64 KB |
| Stylesheet | 37 KB (blocking) | 0 (inlined) | −1 round trip |
| Cumulative layout shift | 0 | 0 | — |

DOM nodes and heap, 60 seeded entries, same profile (nodes are deterministic; heap is read after 2.5 s and moves with GC timing, so it is reported as a range, not a verdict):

| Route | Nodes before | Nodes after | Heap before | Heap after |
|---|---|---|---|---|
| `/dashboard` | 1 913 | **319** | 4.8 MB | 3.9 MB |
| `/calendar` | 1 995 | 1 989 | 8.3 MB | 6.0 MB |
| `/stats` | 624 | 618 | 11.1 MB | 10.4 MB |
| `/settings` | 177 | 172 | 17.2 MB | 13.8 MB |
| `/write` | 244 | 240 | 16.2 MB | 15.0 MB |

`/dashboard` is the one that mattered: a 60-entry diary used to keep every card in the DOM.

## What changed

1. **First paint without the bundle.** `index.html` gained a static first frame — the star system as an `<img>` on the night ground, styled by inline CSS — plus an inline boot script. It is an `<img>` and not inline SVG on purpose: the browser counts images towards LCP, so the paint that arrives with the HTML is the one that sets LCP. `src/main.tsx` now mounts React two frames later, so the static frame is on screen before React replaces it, and the animated version takes over on the same pixels.
2. **The whole stylesheet is inlined** by `scripts/inline-css.mjs`, chained into `npm run build`. The sheet is 38 KB raw / 8 KB gzip, and it was a render-blocking round trip in front of every first paint.
3. **The boot script moved inline**, which removed `public/theme-init.js` from the critical path. `script-src` names its sha256; `scripts/sync-csp-hash.mjs` writes the digest into the three host configs and `scripts/check-csp-parity.mjs` recomputes it, so a stale policy fails the suite instead of silently blocking the theme.
4. **Font preloads cut from five to two.** Preloading every face cost 151 KB of early bandwidth on a slow link, which pushed the stylesheet — and the first paint — past 1.4 s. Only the two faces the opening screen paints (Playfair Display, Cormorant Garamond) are preloaded; the rest load when text uses them. The webfonts the app needs later still arrive before the dashboard paints.
5. **The opening screen is CSS**, not Framer Motion: four keyframes and a `.splash-pivot` origin rule replace three motion groups and a text timeline. Nothing about the sequence changed — same 10 s orbits, same 2 s lift, same 2.2 s greeting, same 3.4 s quote, same 0.8 s exit, same Skip and Escape, same reduced-motion path, which is now handled by the global rule that collapses animation durations. The motion chunk (112 KB) left the first load; it is still fetched by the routes and dialogs that animate.
6. **Barrels stopped carrying Framer Motion.** `@/components/ui` re-exported `Modal`, and `@/components/common` re-exported `ConfirmDialog`; both pull the animation library, and a barrel is imported whole, so every page paid for it. The four pages that open a confirmation import the module directly, and the dashboard lazy-loads `ComposerModal` on the click that opens it.
7. **The dashboard virtualizes at 30 entries instead of 100** (`LIMITS.virtualizeThreshold`), so the common diary holds a screenful of cards rather than all of them.
8. **Heading order**: `EmptyState` used `h3` under the page's `h1`, which Lighthouse flagged. It is an `h2` now.

## Verification

| Check | Result |
|---|---|
| `npm run build` (tsc + vite + inline-css) | pass |
| `npm run typecheck` | pass |
| `npm test` (CSP parity, week buckets, export parsing, entry writes) | ALL PASS |
| `scripts/check-csp-parity.mjs` — now also recomputes the inline script hash | ALL PASS |
| `scripts/sync-csp-hash.mjs --check` | ok, three configs |
| `scripts/smoke-routes.mjs` — 6 routes render, no console errors | pass |
| `scripts/check-features.mjs` | ALL PASS |
| `scripts/check-composer.mjs` | ALL PASS |
| `node scripts/measure-memory.mjs 60` | see table above |

Browser checks on the CSP-served build: the stored theme applies before first paint (no flash), the static frame and the animated opening sit on the same pixels, motion is not requested on the dashboard's first load and is requested when the composer opens, the session flag hides the shell before paint on a repeat visit, reduced motion gets the still card and exits on its own, and the reader still opens from a virtualized card.

## Risks and rollback

- **Inlined CSS is not cached between visits.** Repeat visits now carry 8 KB gzip inside the HTML instead of reusing a cached file. That is the trade for removing a blocking round trip; revert by dropping `scripts/inline-css.mjs` from `npm run build`.
- **The boot script's hash is positional.** Editing `index.html`'s inline script without running `scripts/sync-csp-hash.mjs` blocks it. `.gitattributes` pins the file to LF so a checkout cannot change the bytes, and the parity suite fails loudly.
- **Two copies of the star geometry**: `public/splash-star.svg` (static first frame) and the generated paths in `CelestialStars`. They are the same numbers; changing one without the other shows a small jump at handover.
- **The composer now costs a chunk fetch on first open.** Local, roughly 100 ms warm; if that ever shows on a slow link, the fix is to warm the chunk on idle rather than to un-lazy it.
- Every change is a small, separate diff; each can be reverted on its own.

## Handoff — not applied

- **`Stats` chunk is 428 KB** (Recharts). It is route-lazy, but the charts are the heaviest parse in the app and the stats screen is one click away.
- **`WriteRoute` chunk is 398 KB** (Tiptap). Same shape.
- **Write autosave `JSON.stringify` per keystroke, word-count regex per keystroke, full-collection JSON parse per mutation, `computeStats` multi-pass on mount.** Measured earlier as real; each needs a larger refactor.
- **Avatar images come from a third-party origin** (`api.dicebear.com`) with `connect-src 'self'`, so Lighthouse's preconnect advice cannot be taken without opening the policy. The request is late and small; the diary's own features do not depend on it.
