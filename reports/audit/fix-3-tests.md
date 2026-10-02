# FIX-3 — test/CI/doc fixes from the F audit

Agent: FIX-3. Branch: `fix/repo-audit`. Scope: `scripts/*.mjs`, `package.json` (`scripts` block only),
`.github/workflows/ci.yml` (new). `src/**`, `vercel.json`, `netlify.toml`, `supabase/**` untouched.

## Summary

| Finding | Status | What changed |
|---|---|---|
| F-01 (P0) | fixed | localhost guard copied into the 4 unguarded browser suites that clear localStorage |
| F-02 (P1) | fixed | 4 suites added to `npm test` (3 from the finding + 1 new pure suite from F-03) |
| F-03 (P1) | fixed | copied regex deleted from `check-features.mjs`; real `htmlToText`/`entryAsText` asserted in a new pure suite |
| F-04 (P1) | fixed | new browser suite `check-sanitize.mjs` exercises the real DOMPurify through the app's own read and render paths |
| F-11 (P2) | fixed | the false sanitizer claim in the perf report corrected |
| F-05 (CI) | fixed | `.github/workflows/ci.yml` created |

`npm test` suites: 5 before, 9 after. `npm test` green before and after. `package.json`
`sideEffects` unchanged.

## Changes

### F-01 — localhost guard on the storage-clearing browser suites

The guard is the existing one from `scripts/check-sync-removed.mjs:26-29`, byte-identical in
wording and semantics (allows `localhost`/`127.0.0.1`/`[::1]`, refuses everything else with a
clear message and `exit 1`). It is placed immediately after `BASE` is computed and before
`chromium.launch()`, so a non-local origin is refused before any page, let alone any storage
write.

| File | Guard now at |
|---|---|
| `scripts/check-composer.mjs` | 22-27 |
| `scripts/check-features.mjs` | 19-24 |
| `scripts/check-pdf-export.mjs` | 19-24 |
| `scripts/check-export.mjs` | 22-27 |

`scripts/check-sanitize.mjs` (new) carries the same guard.

### F-02 — suites added to `npm test`

`package.json:19`, appended after the existing five, order preserved:

```
check-sync-stamps.mjs  check-sync-push-deny.mjs  check-week-bucket.mjs  check-parse-export.mjs
```

The first three were named by the finding; `check-parse-export.mjs` is the F-03 suite and is
pure Node, so it belongs in the same command.

### F-03 — real app function instead of a copied regex

`scripts/check-features.mjs` no longer re-implements `htmlToText`. The browser suite keeps only
what needs a browser (the reader renders the body); the conversion assertion moved to the new
pure suite `scripts/check-parse-export.mjs`, which imports the app modules through the harness
loader exactly as `check-sync-harness.mjs` does:

```js
const { htmlToText, htmlToMarkdown } = await loadSrc('lib/parse.ts');
const { entryAsText } = await loadSrc('services/exportService.ts');
```

Chosen over driving the "Export plain text" button in the browser because the export path ends
in a `download()` — the text goes into a Blob and cannot be read back from the page. Asserting
the real function (and `entryAsText`, the builder that button calls) is both less code and a
stronger check than a clipboard probe would be. `check-features.mjs` went from 15 to 14 checks;
the perf report's suite table was updated to say so.

### F-04 — sanitizer suite (no jsdom available)

`jsdom` is not in `node_modules` and adding a dependency is out of scope, so the pure-Node route
is unavailable. Rather than a suite that stubs DOMPurify into a pass-through and proves nothing,
`scripts/check-sanitize.mjs` is a **browser** suite that exercises the real sanitizer through the
app's own two paths:

1. **Repair-on-read** (`coerceEntry` -> `sanitizeEntryHtml`, `src/services/entryFields.ts:74`).
   Records are seeded directly into localStorage with all XSS vectors; the app repairs them on
   read and writes the sanitized body back. The suite then reads `localStorage` and asserts no
   executable marker survives — this is the assertion a pass-through stub cannot satisfy, and it
   is exactly what an imported backup goes through.
2. **Render** (`ReaderContent` -> `sanitizeEntryHtml`, `src/pages/Reader/ReaderContent.tsx:19`).
   A `<table>` record is seeded alone; `looksUnsafe` does not flag it, so storage keeps the table
   while the reader shows it stripped. That isolates the render-path sanitizer call.

Vectors covered: `<script>`, `<img onerror=>`, `javascript:` href, `data:text/html`, `<iframe>`,
`<svg onload=>`, `onclick=`, `<form>`, `<object>`, `<embed>`, `<style>` (11 families).
Positive cases asserted unchanged: `<p>`, `<strong>`, `<em>`, `<h2>`, `<ul>/<li>`,
`<blockquote>`, `<pre><code>`, `<hr>`, `https://` link, `data:image/png;base64,` image.

The suite has teeth — verified by mutation. A copy of `dist/` was patched so the bundle's
sanitize function returns its input unchanged, served on a second port, and the suite run against
it: **7 checks failed**, including the `onerror` vector actually firing (`window.__xss` set to 2)
and every marker leaking into storage. The real bundle then passed all 26 checks. The mutation
was applied only to a copy under `/tmp`; the repo's `dist/` was not modified.

Two honest limitations recorded rather than papered over:

- The test server sends `script-src 'self'`, so a surviving inline `onerror` could not execute
  even if it survived. The load-bearing assertions are therefore the DOM-shape and
  storage-content ones; the execution probe is a secondary signal.
- The suite is a browser suite and needs the CSP server, so it is not in `npm test` (which stays
  browser-free). It is in the same class as `check-composer.mjs`/`check-features.mjs`: run
  manually or in a future browser job.

### F-11 — report corrected

`reports/perf/supabase-sync-implementation.md:52-57`: the claim that the sanitizer "is exercised
by the browser suite and `check-features.mjs`" is replaced with the truth — those suites alias
DOMPurify to a pass-through stub and never touch `src/lib/sanitize.ts`; the sanitizer is covered
by `check-sanitize.mjs`; the original claim was wrong. Line 122's `check-features.mjs` count was
updated 15 -> 14 to match the F-03 change. Nothing else in the report was removed.

### CI — `.github/workflows/ci.yml` (new)

Runs `npm ci`, `npm run typecheck`, `npm run lint:emoji`, `npm test` on Node 24 on every push and
pull request. No build job, no deploy step, no matrix: the host already builds and deploys, and
`npm run build` is deliberately not run here so the workflow stays a gate and not a second build
system. Safe because all four commands were verified green locally, including under `TZ=UTC`
(the runner's timezone) so the date-sensitive suites cannot fail on the runner for a clock reason
the local run would hide. The browser suites are not in the workflow because Playwright is a
global install, not a project dependency (finding F-16, not in this scope).

## Raw output

### Before — `npm test 2>&1 | tail -6`

```console
$ npm test 2>&1 | tail -6
PASS  netlify.toml and serve-with-csp.mjs are byte-identical — 286 vs 286
PASS  connect-src allows https://*.supabase.co — connect-src 'self' https://*.supabase.co wss://*.supabase.co
PASS  connect-src allows wss://*.supabase.co — connect-src 'self' https://*.supabase.co wss://*.supabase.co
PASS  no unsafe-eval anywhere in the policy — absent
PASS  script-src does not carry 'unsafe-inline' — script-src 'self'
ALL PASS
BEFORE_EXIT=0

$ node -e "...match(/scripts\/[\w.-]+\.mjs/g)..."
count= 5
  scripts/check-sync-harness.mjs
  scripts/check-sync-merge.mjs
  scripts/check-sync-race.mjs
  scripts/check-sync-storage.mjs
  scripts/check-csp-parity.mjs
```

### After — `npm test 2>&1 | tail -25`

```console
$ npm test 2>&1 | tail -25
PASS  an invalid email keeps the server wording
PASS  a failed fetch becomes the connection text
PASS  a network error becomes the connection text
PASS  an unknown throw becomes the connection text
PASS  an empty error message becomes the connection text
PASS  the adapter guards a non-empty push that accepted nothing — rows.length > 0 && accepted.length === 0
PASS  the guard throws a RemoteError naming the session
ALL PASS
weekStart      : Sun Sep 27 2026 00:00:00
lastHourOfWeek : Sat Oct 03 2026 23:58:59
oldEnd         : Sat Oct 03 2026 00:00:00 | counted: false
newEnd         : Sat Oct 03 2026 23:59:59 | counted: true
PASS: the final hours of the week are counted
subDays        : 2026-03-09 (expected 2026-03-09)
PASS: subDays steps exactly one calendar day

# export conversions
PASS  paragraphs keep their break — "First para.\nSecond para."
PASS  a hard break becomes a newline — "line one\nline two"
PASS  list items become their own lines — "one\ntwo"
PASS  entities decode after tags are stripped — "<3 & more"
PASS  markdown headings and bold survive — "# Title\n\n**bold**"
PASS  entryAsText keeps the paragraph break — "T\nTuesday, September 1, 2026\nMood: calm\nFirst para.\nSecond para.\n— 1 words, 1 min read"
PASS  entryAsText starts with the title — "T\nTuesday, September"
ALL PASS
AFTER_EXIT=0

$ node -e "...match(/scripts\/[\w.-]+\.mjs/g)..."
count= 9
  scripts/check-sync-harness.mjs
  scripts/check-sync-merge.mjs
  scripts/check-sync-race.mjs
  scripts/check-sync-storage.mjs
  scripts/check-csp-parity.mjs
  scripts/check-sync-stamps.mjs
  scripts/check-sync-push-deny.mjs
  scripts/check-week-bucket.mjs
  scripts/check-parse-export.mjs

$ TZ=UTC npm test 2>&1 | grep -E "FAIL|ALL PASS|FAILED"
ALL PASS   (x8; week-bucket prints PASS lines, not "ALL PASS", so 8 of 9 blocks)
TZ_UTC_EXIT=0
```

### F-01 — refusal proof (non-local origin, nothing touched)

```console
$ for s in check-composer check-features check-pdf-export check-export; do
    BASE_URL=https://example.com node scripts/$s.mjs; echo "exit=$?"; done
########## check-composer.mjs ##########
Refusing to run: https://example.com is not a local origin, and this script clears storage.
exit=1
########## check-features.mjs ##########
Refusing to run: https://example.com is not a local origin, and this script clears storage.
exit=1
########## check-pdf-export.mjs ##########
Refusing to run: https://example.com is not a local origin, and this script clears storage.
exit=1
########## check-export.mjs ##########
Refusing to run: https://example.com is not a local origin, and this script clears storage.
exit=1
```

### F-01 — normal local path unaffected (no `BASE_URL`, server on 5212)

```console
########## check-composer.mjs ##########   PASS  no console errors   ALL PASS   exit=0
########## check-features.mjs ##########   PASS  no console errors   ALL PASS   exit=0
########## check-pdf-export.mjs ########## no page errors   PASS   exit=0
########## check-export.mjs ##########     PASS  no console errors   ALL PASS   exit=0
########## check-sanitize.mjs ##########   PASS  no console errors   ALL PASS   exit=0
```

### F-03 — assertion now calls the real implementation

```console
$ node scripts/check-parse-export.mjs
# export conversions
PASS  paragraphs keep their break — "First para.\nSecond para."
PASS  a hard break becomes a newline — "line one\nline two"
PASS  list items become their own lines — "one\ntwo"
PASS  entities decode after tags are stripped — "<3 & more"
PASS  markdown headings and bold survive — "# Title\n\n**bold**"
PASS  entryAsText keeps the paragraph break — "T\nTuesday, September 1, 2026\nMood: calm\nFirst para.\nSecond para.\n— 1 words, 1 min read"
PASS  entryAsText starts with the title — "T\nTuesday, September"
ALL PASS
exit=0
```

### F-04 — sanitizer suite, real bundle

```console
$ node scripts/check-sanitize.mjs
PASS  a <table> is not a repair trigger, so storage keeps it — <table><tr><td>cell</td></tr></table><p>
PASS  the reader strips the table even though storage was not repaired — hasTable=false
PASS  the table cell text is kept — "cellafter"
PASS  the reader rendered the entry body
PASS  no script/iframe/object/embed/svg/form/style/table node survives
PASS  no on* event attribute survives
PASS  no javascript: or data:text/html URL survives
PASS  the stripped script body is not left as text — js linkdata linkclickableHello bold and emoutboundHeading
PASS  no vector executed (window.__xss unset) — undefined
PASS  allowed markup: <strong> survives
PASS  allowed markup: <em> survives
PASS  allowed markup: <h2> survives
PASS  allowed markup: <ul><li> survives
PASS  allowed markup: <blockquote> survives
PASS  allowed markup: <pre><code> survives
PASS  allowed markup: the https link keeps its href — {"href":"https://example.com/page","rel":"","target":""}
PASS  no link is left with a target but without rel=noopener — {"href":"https://example.com/page","rel":"","target":""}
PASS  allowed markup: the data:image/png image survives — data:image/png;base64,iVBORw0KGgoAAAANSU
PASS  the repaired record is still stored
PASS  the stored body carries no executable marker — clean
PASS  the stored body keeps the allowed markup — <img><a>js link</a><a>data link</a><p>clickable</p><p>Hello
PASS  the stored body keeps the image — kept
PASS  the safe record was written back
PASS  safe markup passes the sanitizer byte-identical — "<p>Hello <strong>bold</strong> and <em>em</em></p><a href=\"https://example.com/p"
PASS  reading a clean diary does not rewrite storage — unchanged
PASS  no console errors

ALL PASS
exit=0
```

### F-04 — mutation proof (suite is not vacuous)

A copy of `dist/` under `/tmp` had the bundle's sanitize call replaced with a pass-through
(`function ci(t){return t?uo.sanitize(t,...)}` -> `function ci(t){return t?t`), served on port
5313, suite run with `BASE_URL=http://localhost:5313`:

```console
$ BASE_URL=http://localhost:5313 node scripts/check-sanitize.mjs 2>&1 | grep -E "FAIL|ALL PASS|FAILED"
FAIL  the reader strips the table even though storage was not repaired — hasTable=true
FAIL  no script/iframe/object/embed/svg/form/style/table node survives — script, iframe, svg, form, object, embed, style
FAIL  no on* event attribute survives — img[onerror], svg[onload], p[onclick]
FAIL  no javascript: or data:text/html URL survives — a[href], a[href]
FAIL  the stripped script body is not left as text — window.__xss=1js linkdata linkclickablebody{display:none}Hel
FAIL  no vector executed (window.__xss unset) — 2
FAIL  the stored body carries no executable marker — <script, onerror, onclick, javascript:, data:text/html, <iframe, <svg, <object, <embed, <form, <style
7 FAILED
mutant_exit=1
```

### `package.json` scripts and the `sideEffects` invariant

```console
$ node -e "const p=require('./package.json');console.log(JSON.stringify(p.scripts,null,2));console.log('sideEffects=',JSON.stringify(p.sideEffects))"
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit --pretty false",
  "lint:emoji": "eslint src --ext .ts,.tsx",
  "sync:on": "node scripts/activate-supabase.mjs",
  "sync:off": "node scripts/activate-supabase.mjs --off",
  "test": "node scripts/check-sync-harness.mjs && node scripts/check-sync-merge.mjs && node scripts/check-sync-race.mjs && node scripts/check-sync-storage.mjs && node scripts/check-csp-parity.mjs && node scripts/check-sync-stamps.mjs && node scripts/check-sync-push-deny.mjs && node scripts/check-week-bucket.mjs && node scripts/check-parse-export.mjs"
}
sideEffects= ["**/*.css","**/styles/**"]
```

## Side findings from this work

### Resolved by a parallel agent while this ran

1. **`src/lib/sanitize.ts:50-52` was unreachable code — now fixed.** When this suite was written,
   the regex forcing `rel="noopener noreferrer"` on `target="_blank"` links could never match:
   the app's `ALLOWED_URI_REGEXP` (`/^(?:https?|mailto|tel|data:image\/)/i`) is applied by
   DOMPurify to every attribute value, so `target="_blank"` and `rel="opener"` were stripped
   before the replace ran (verified through the real bundle: `<a href="https://x" target="_blank" rel="opener">`
   came out as `<a href="https://x">`). During this task another agent modified
   `src/lib/sanitize.ts` to add `ADD_URI_SAFE_ATTR: ['target', 'rel']`, which exempts those two
   attributes from the URI check and makes the forcing branch live. Verified directly against the
   real DOMPurify ESM with the new options:

   ```console
   $ node probe-newsanitize.mjs   # real DOMPurify, new src/lib/sanitize.ts options
   plainLink      -> "<a href=\"https://example.com/p\">plain</a>"
   blankNoRel     -> "<a href=\"https://example.com/p\" target=\"_blank\" rel=\"noopener noreferrer\">blank</a>"
   blankWithRel   -> "<a href=\"https://example.com/p\" target=\"_blank\" rel=\"noopener noreferrer\">blankRel</a>"
   relOnly        -> "<a href=\"https://example.com/p\" rel=\"noopener\">relOnly</a>"
   jsHref         -> "<a>js</a>"
   dataText       -> "<a>d</a>"
   onerror        -> "<img>"
   script         -> ""
   svg            -> ""
   iframe         -> ""
   onclick        -> "<p>c</p>"
   dataPng        -> "<img src=\"data:image/png;base64,iVBORw0KGgo=\" alt=\"d\">"
   table          -> "cell"
   ```

   Every vector is still stripped; the opener protection now applies. `check-sanitize.mjs` asserts
   the invariant ("no link with a target but without `rel=noopener`") rather than the current
   spelling, so it passes against both the old and the new implementation.

2. **`data:image/svg+xml` is accepted by `<img src>`.** `ALLOWED_URI_REGEXP` permits any
   `data:image/` prefix, and `<img src="data:image/svg+xml;base64,...">` survives. SVG in an
   `<img>` cannot run script (the browser does not execute scripts in image documents), so this
   is not a live XSS, but it is a wider allowance than the comment implies ("Blocks
   `javascript:` and `data:` URLs, allowing images"). Worth a deliberate decision.
3. **`src/lib/index.ts:18` exports `looksUnsafe`,** and `src/lib/sanitize.ts:56-60` calls it a
   "cheap pre-check", which is accurate. No action needed; noted so the new suite's reliance on
   it (the `<table>` case) is understood as testing the intended contract.

### Important caveat on the F-04 evidence

`dist/` was built at 11:55 on 2026-10-02. `src/lib/sanitize.ts` was modified at 12:26 by a
parallel agent, and this task is forbidden from running `npm run build`, so the browser suites
in this report ran against the **pre-change** bundle. Two consequences, stated plainly:

- What the 26-check run proves is the sanitizer behavior of the 11:55 build. The vectors it
  covers are stripped by both the old and the new implementation (confirmed by the direct probe
  above against the new options), so the security conclusion carries over, but it is not a run of
  the current source.
- The "safe markup byte-identical" and link-attribute assertions were written to hold for both
  implementations. A rebuild plus a re-run is the check that closes this gap; it is one command
  (`npm run build && node scripts/serve-with-csp.mjs & node scripts/check-sanitize.mjs`) and is
  left to whoever owns the build for the round.


## Handoff — findings not fixed by FIX-3

| ID | P | Why not fixed here |
|---|---|---|
| F-05 | P1 | **Fixed.** `.github/workflows/ci.yml` created; see above. |
| F-06 | P1 | Out of scope (README + `package.json` `engines`). `package.json` is restricted to the `scripts` block for this task. The new CI workflow pins Node 24, so CI itself is unaffected; the README/engines gap remains for another agent. |
| F-07 | P2 | Out of scope (README prose about DiceBear). |
| F-08 | P2 | Out of scope (README barrel-export claim). |
| F-09 | P2 | Out of scope (README scripts table missing `npm test`/`lint:emoji`). |
| F-10 | P2 | Partly addressed: `check-week-bucket.mjs` is now in `npm test`, so it is no longer orphaned. `check-export.mjs` is still orphaned and still duplicates `check-pdf-export.mjs` more deeply; picking one and deleting the other is a decision for the repo owner, and the F-01 guard was added to it so it is at least no longer dangerous if run. |
| F-11 | P2 | **Fixed** for the sanitizer claim. The stale numbers elsewhere in that report (172 checks, CSS 7,829 bytes, "four sync suites") were left alone: they are F-13's scope, and the F-13 items are historical figures from a different round, not false claims about tests that do not exist. |
| F-12 | P2 | Out of scope: source-text assertions in `check-sync-push-deny.mjs` F3 and `check-sync-race.mjs` SQL grep. Documented honestly by the audit; making them behavioral needs the adapter to load under Node, which is a larger change. |
| F-13 | P2 | Out of scope (stale numbers in `reports/perf/`). Only the count I directly invalidated (check-features 15 -> 14) was corrected. |
| F-14 | P2 | Out of scope (`.gitignore`). |
| F-15 | P2 | Out of scope (build-freshness check for browser suites). Noted: `check-sanitize.mjs` inherits this limitation like every other browser suite. |
| F-16 | P2 | Out of scope: Playwright is still a global install. This is why the new sanitizer suite is not in `npm test` or in the CI workflow; when F-16 is fixed, moving it into CI is a one-line addition. |

## Notes for the next agent

- `npm test` is now 9 suites and takes noticeably longer (the sync suites do real work); it is
  still browser-free and credential-free.
- `check-sanitize.mjs` needs `node scripts/serve-with-csp.mjs` first, like the other browser
  suites. It refuses non-local origins.
- The mutation harness used to prove the sanitizer suite (a patched copy of `dist/` served on a
  second port) is not committed: it was a one-off verification under `/tmp`. If the team wants it
  as a standing check, it belongs in a `scripts/mutate-*.mjs` with the same localhost guard.
