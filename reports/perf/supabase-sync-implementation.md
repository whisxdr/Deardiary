# Supabase Auth and local-first sync — implementation and verification

Date: 2026-10-01
Build: Vite 5 / React 18 / TypeScript 5 / Node 24.19.

## Summary

Restored optional cross-device sync with Supabase email OTP. `localStorage` remains authoritative offline; sync turns on only when both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist. RLS scopes cloud records to account, but entry text is plaintext in Supabase. Deletes use scrubbed tombstones; reconciliation unions ids and resolves conflicts deterministically.

Four sync suites, 172 checks, green on the runs noted below:

| Suite | Kind | Checks | Covers |
|---|---|---|---|
| `scripts/check-sync-merge.mjs` | pure | 43 | union-by-id, later-stamp-wins, deterministic full-field ties, tombstones, tie restamping |
| `scripts/check-sync-race.mjs` | pure | 44 | compare-and-delete, pull/push races, failed requests, clock skew, RPC acceptance, pagination, partial/all-rejected `accepted` retry |
| `scripts/check-sync-storage.mjs` | pure | 56 | tombstone durability/scrubbing, import restore rules, account isolation |
| `scripts/check-sync-removed.mjs` | browser | 29 | config-off: account hidden, no Supabase requests/chunks, privacy copy honest, tombstones preserved |

`scripts/check-sync-harness.mjs` is shared support: it loads real `src/` TypeScript modules under plain Node, installs fake `localStorage` before imports, and carries a differential merge oracle. It is a regression check, not an independent security proof.

## Files

| File | Status | Role |
|---|---|---|
| `scripts/check-sync-harness.mjs` | new | Node TS loader, fake storage, oracles, stub adapter, deferred helper, reporter |
| `scripts/check-sync-merge.mjs` | new | merge contract tests + differential oracle check |
| `scripts/check-sync-race.mjs` | new | race and outbox tests against the real engine |
| `scripts/check-sync-storage.mjs` | new | tombstone and ownership durability tests |
| `scripts/check-sync-removed.mjs` | rewritten | config-off browser suite (was the post-revert "no trace" check) |
| `reports/perf/supabase-sync-implementation.md` | new | this report |

The three pure suites and the harness are new names; the prior `check-sync-merge.mjs`,
`check-sync-race.mjs` and `check-sync-e2e.mjs` were deleted by the revert, so there was no
name collision to avoid. The browser suite's per-route config-off block was added after the
first draft of this report claimed `/stats` coverage the suite did not have (see
"Corrections to earlier claims").

## How the pure suites run without a network or credentials

`import.meta.env` is a Vite-only binding and Supabase needs credentials, so the pure suites
never import the adapter or the config. They import the framework-free core — merge, engine,
outbox, clock, owner, the write path — and drive the engine with a stub adapter:

- The engine (`syncNow`) takes the adapter as an argument, so a test supplies one whose
  `pull`/`push` are scripted. The pull-await-write race is held open with a deferred promise
  instead of a network delay: no timing guesswork, and the interleaving is the test's to
  choose. This is the "stub adapter unit test" the brief asked for.
- `src/lib/storage.ts` probes `localStorage` once at module load, so the harness installs an
  object-backed fake on `globalThis` before the first `src/` import. The fake is per-process
  and never touches a real browser origin, so there is no localhost guard to make in the
  pure suites.
- DOMPurify needs a DOM, so the loader aliases it to a pass-through stub. Sanitizing is not
  what these suites test; the real sanitizer is exercised by the browser suite and
  `check-features.mjs`.
- Node 24 strips TypeScript types natively, confirmed here: `node -p "process.features.typescript"`
  prints `strip` on this machine's v24.19.0. The loader adds a resolver for the `@/` alias and
  extensionless relative imports.

## What each required case maps to

| Required case | Suite | Check |
|---|---|---|
| tombstone durability across unrelated mutation | storage | "the tombstone survives an unrelated create/edit/delete" |
| delete/clear-all tombstones | storage + browser | "the deleted record is still stored as a tombstone"; "clear all writes tombstones for every entry" |
| outbox compare-and-delete race | race | "a stale-stamp clear leaves the newer change queued" |
| union-by-id | merge | "union keeps every id from both sides" |
| deterministic ties | merge | "an exact tie picks the same winner on both devices" |
| account isolation when owner changes | storage | "the previous account's entries/queue are dropped" |
| pull-await-write race | race | "the write made during the pull is not erased by the write-back" |
| env-not-configured UI hidden / privacy honest | browser | "no Account entry in the settings nav"; "the privacy copy is the unconditional local-only line" |

The pull-await-write case is the exact bug the pre-revert `check-sync-race.mjs` proved:
`engine.ts` snapshots the collection, awaits the pull, then writes back a merge of that
snapshot and the server's answer, so a write landing in the round trip is in neither input
and is erased. The re-enabled engine re-reads `listAllRecords()` *after* the await; the race
suite pins that behaviour.

## Verification

Run from the repo root. The pure suites need no server; the browser suite needs the built
app served with production headers.

```bash
# Pure suites — no network, no credentials, no server (also: `npm test`)
node scripts/check-sync-harness.mjs
node scripts/check-sync-merge.mjs
node scripts/check-sync-race.mjs
node scripts/check-sync-storage.mjs
node scripts/check-csp-parity.mjs

# Browser suite — build, then serve with the production CSP, then run
npm run build
node scripts/serve-with-csp.mjs &          # http://localhost:5212
node scripts/check-sync-removed.mjs
```

`npm test` runs the five pure suites only; it deliberately excludes
`check-sync-removed.mjs`, which needs a config-off build served with the production CSP.

> **Caveat on `check-sync-removed.mjs`.** Its "ALL PASS (29)" holds **only for a build with
> sync off** — no `VITE_SUPABASE_*` in the build environment (or `.env.local`). On a tree
> whose `dist/` was built with sync **on** (a populated `.env.local`), the config-off
> assertions are invalid by construction and the suite fails (observed 4/29 on such a tree).
> It is not an unconditional green; it is green only against a config-off build. A clean
> config-off run means clearing the env vars and rebuilding first.

| Check | Final result |
|---|---|
| `check-sync-harness.mjs` | ALL PASS (4) |
| `check-sync-merge.mjs` | ALL PASS (43) |
| `check-sync-race.mjs` | ALL PASS (44) |
| `check-sync-storage.mjs` | ALL PASS (56) |
| `check-csp-parity.mjs` | ALL PASS (9) |
| `check-sync-removed.mjs` | ALL PASS (29) **only on a build with sync off** — see caveat below |
| `npm run typecheck` | pass |
| `npm run build` | pass, no Rollup circular-chunk warning |
| `npm run lint:emoji` | pass |
| `scripts/smoke-routes.mjs` | six routes render, no console errors |
| `scripts/check-features.mjs` | ALL PASS (15) |
| `scripts/check-composer.mjs` | ALL PASS (16) |
| `scripts/check-pdf-export.mjs` | PASS; PDF chunks loaded only after export action |
| Modularity sweep | pages, hooks, services, utils, components within hard limits |

The browser suite asserts the config-off bundle makes **no** request to any Supabase origin
and downloads no Supabase chunk, checked per route on `/`, `/dashboard`, `/settings` and
`/stats`. With the two env vars unset, `syncEnabled()` is false, so the dynamic import of
`@supabase/supabase-js` never runs. The chunk that holds the library is `index-CPaXMYbI.js`
(227.8 KB raw / 59.3 KB gzip), together with `adapter-*.js` (2.6 KB) and `auth-*.js`; none
are requested. The suite also reads each downloaded chunk's body and fails if the
`@supabase/supabase-js` / `GoTrueClient` marker appears, so a chunk that pulled the library
in without a network call would still fail.

> The first draft of this report named `index.es-*.js` as the Supabase chunk. That is wrong:
> `index.es-*.js` is `canvg` (a jsPDF SVG-rendering dependency, 150.9 KB raw / 51.6 KB gzip),
> pulled only by `jspdf.es.min-*.js`. The Supabase library is in `index-CPaXMYbI.js`. The
> chunk names were re-checked against a clean `npm run build` (see
> "Corrections to earlier claims").

## Manual Supabase setup required before the feature works

The app is honest without this — sync stays off and the Account section is hidden — but
these steps are needed to turn it on. Nothing here is done by the test suite.

1. **Create the project and the table.** Run
   `supabase/migrations/20261001000000_entries.sql` in the Supabase SQL editor (or
   `supabase db push`). It creates `public.entries` with a per-owner composite key `(owner_id, id)`,
   enables row-level security with select/insert/update/delete policies scoped to `auth.uid() = owner_id`,
   adds the `(owner_id, updated_at desc)` index, and defines the authenticated-only `upsert_entries`
   RPC whose `on conflict ... where public.entries.updated_at < excluded.updated_at` clause is the
   atomic guard against a stale push from another device.

2. **Add `{{ .Token }}` to both email templates.** Authentication > Email Templates >
   **Confirm signup** (new accounts) and **Magic Link** (existing accounts). The sign-in is a
   six-digit code, not a link; Supabase only includes digits when each applicable template
   contains the token placeholder. Without it the mail carries only a link and the code field
   cannot be filled. Suggested body for both: `Your DearDiary code is {{ .Token }}`.

3. **Set both env vars in the host.** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (Project Settings > API). The anon key is public by design; RLS is what protects the
   data. On Vercel: Project > Settings > Environment Variables. On Netlify: Site
   configuration > Environment variables. Vite inlines `VITE_*` at build time, so a change
   needs a redeploy, not just a restart.

4. **Confirm the CSP allows the project origin.** Both `vercel.json` and `netlify.toml`
   already carry `connect-src 'self' https://*.supabase.co wss://*.supabase.co` (the
   websocket is for Realtime, which the adapter does not use yet but the origin allows). A
   project on a custom domain rather than `*.supabase.co` would need that origin added, or
   every fetch is blocked by the browser and the failure looks like a network error.

5. **Deploy the migration before the client.** A build with the env vars set but no table
   fails every pull with a Postgres error. Apply the migration first.

The reference local backend used before the revert (`scripts/serve-sync.mjs`) was removed by
the revert and is not restored here; the re-enabled model talks to Supabase directly through
the SDK, so the old JSON-file server is not part of this suite.

## Limits

- **Node version.** Verified on Node 24.19.0: `process.features.typescript === 'strip'`, so
  the pure suites run with no flag. The Node 22 fallback (`--experimental-strip-types`) is
  **unverified** — no Node 22 runtime was available here — and is documented only as the
  likely requirement. This is test-harness only and does not touch the app, which Vite builds.
- **The pure suites do not import `src/services/supabase/config.ts`.** `import.meta.env`
  does not exist under plain Node, so the env-not-configured guarantee is checked in the
  browser suite against the real built bundle instead. That is the stronger check: it tests
  the actual `syncEnabled()` output, not a stub.
- **`Entry` carries an unused `deardiary:session` storage key.** `storageKeys.ts` defines
  `session`, but no `src/` module reads or writes it — the Supabase SDK owns the session.
  Not a test failure, and outside this work's scope to remove; noted so the key is not
  mistaken for live state.
- **No cold-start pull was tested against a live backend.** The lifecycle now triggers a pass after session restore; focus/online and outbox changes also trigger passes. Browser suite runs config-off only.
- **No real Supabase round trip is exercised.** By design: the suites need no credentials. Merge, races, and storage rules run against real core modules; adapter HTTP calls and the `upsert_entries` RPC still need a live project.
- **The browser suite samples storage, it does not prove every write path.** Exhaustive tombstone and owner cases are in the pure storage suite.
- **`check-sync-removed.mjs` uses `page.getByRole` with a label regex for delete confirmation.** Accessible-name drift fails at click, not assertion; treat as UI-copy drift, not sync bug.

## Corrections to earlier claims

An earlier draft of this report made four claims that did not survive review against the
current tree and a clean rebuild. They are corrected here so the report is not read as
stronger than it is.

1. **"No `.env`, CSP, or README change was made by this work."** The working tree *does*
   change the CSP. `git diff` shows `connect-src 'self'` became
   `connect-src 'self' https://*.supabase.co wss://*.supabase.co` in `vercel.json`,
   `netlify.toml`, and `scripts/serve-with-csp.mjs`, and `.env.example` gained the two
   Supabase variables. Those edits were made by the sync feature work, not by this test work;
   the sentence was corrected to say so rather than to claim no change exists.
2. **"No existing file was modified."** `scripts/check-sync-removed.mjs` is a rewrite of the
   post-revert file (97 insertions / 60 deletions vs `HEAD`), and it was extended again here
   with the per-route config-off block.
3. **The Supabase chunk was misidentified.** The library is in `index-CPaXMYbI.js`
   (227.8 KB raw / 59.3 KB gzip), not `index.es-*.js`. `index.es-*.js` is `canvg`, a jsPDF
   dependency (150.9 KB raw / 51.6 KB gzip). Verified by grepping the built chunks for
   `GoTrueClient` / `@supabase/supabase-js` (only `index-CPaXMYbI.js` and `adapter-*.js`) and
   for `canvg` (only `index.es-*.js`).
4. **`/stats` was claimed as covered by the browser suite when it was not.** The first draft
   listed `/stats` among the routes asserted to make no Supabase request, but the suite never
   navigated there. The per-route block added in this work now visits `/`, `/dashboard`,
   `/settings` and `/stats` and asserts three things on each: no Supabase-origin request, no
   downloaded chunk containing the Supabase marker, and no off-origin request other than
   DiceBear image fetches. All four routes pass.

## Note on security

The project has not been security-audited. The pre-commit security scan reports incomplete,
so the green checks above are not a security clearance. The anon key is public by design and
RLS is the access boundary; the migration is the file that has to be reviewed before a real
deployment trusts it.
