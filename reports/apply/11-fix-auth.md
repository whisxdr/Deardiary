# 11 — Fix auth/owner P1 findings (W2-AUTH)

## Summary

Three P1 findings fixed inside the W2-AUTH scope. All three are small, local changes;
no other file was touched, no git command run, no `npm run build`.

- F1: `clearLocalEntries` now also removes the stored draft, so a different account
  signing in on the same browser cannot resume the previous owner's unfinished text.
  Settings are deliberately kept.
- F2: `authFailureMessage(error)` exported from `auth.ts` (and re-exported from
  `adapter.ts`). It passes the server's own wording through and only substitutes the
  connection text for a genuine transport failure.
- F3: `adapter.push` throws a `RemoteError` when a non-empty push is accepted in full
  zero times, instead of letting the engine read `[]` as "all stale" and stall silently.

`syncStore.ts` was verified, not changed: it already renders `report.error`
(`src/store/syncStore.ts:170-171`), and the F3 message has no network keyword, so
`isOffline` classifies it as `error`, not `offline`.

## Changes

### F1 — draft leak on owner switch

`src/services/sync/owner.ts:2` — import `removeKey` alongside `readJson`/`writeJson`.

`src/services/sync/owner.ts:28` — inside `clearLocalEntries()`:
```ts
removeKey(STORAGE_KEYS.draft);
```
Reason: `claimDevice` calls `clearLocalEntries()` when the signing-in account differs
from the stored owner. It cleared entries and outbox only, leaving
`deardiary:draft` from the previous account, which the new account could reopen via
"Continue Writing" (`src/pages/Write/writeFormStart.ts:37`, reached from
`src/pages/Landing/Landing.tsx:34`). `removeKey` is the existing storage helper
(`src/lib/storage.ts:92`), already used for the same key in
`src/pages/Write/useWriteActions.ts:86`.

Settings (`deardiary:settings`) are NOT cleared: displayName/bio/avatar are per-device
preferences, not another account's content, and clearing them would change functional
behaviour nobody asked to change.

Store refresh: the callers already do `useEntryStore.getState().refresh()` on the
`foreign` branch (`src/store/syncStore.ts:75,108,148`). Verified still correct; left
unchanged.

### F2 — OTP error misreported as a connection problem

`src/services/supabase/auth.ts:27-47` — added `CONNECTION_MESSAGE`,
`isNetworkFailure(message)`, and the exported pure helper:
```ts
/** Classifies an auth failure so the form can explain it instead of blaming the network. */
export function authFailureMessage(error: unknown): string
```
Behavior: empty/unknown error or a transport-looking message
(`fetch|network|offline|reach|connection|timed out|load failed`) returns the connection
text; anything else returns the original `error.message`. So a 429 ("you can only
request this after N seconds") reaches the user verbatim.

`src/services/supabase/adapter.ts:9` — `export { authFailureMessage } from './auth';`
so the sign-in form can import it from the same adapter surface it already uses.

`requestCode` still throws `new Error(error.message)` unchanged, so the real message
already propagates; the helper is what the UI needs to stop replacing it.

### F3 — RLS/session refusal of a `[]` push stalls the queue

`src/services/supabase/adapter.ts:56-62` — after the accepted list is computed:
```ts
if (rows.length > 0 && accepted.length === 0) {
  throw new RemoteError(
    'The server refused every change. Your session may have expired; sign in again.',
  );
}
```
Reason: the RPC returns only the ids it accepted. A stale row is left out of a
non-empty result, so a partial rejection keeps working. Zero accepted out of a
non-empty push means the write was refused wholesale (RLS sees no `auth.uid()` —
expired/missing session — or the policy rejected every row). Without this guard the
engine keeps the queue with `report.error` empty and status `idle`, showing
"N waiting to upload" forever. `engine.ts` was not touched.

## Raw output

### Before — regression (baseline, pre-change)

```
$ node scripts/check-sync-storage.mjs && node scripts/check-sync-race.mjs && node scripts/check-sync-harness.mjs
# sync storage and ownership
... (57 PASS) ...
ALL PASS

# sync races
... (45 PASS) ...
ALL PASS

# sync harness self-check
PASS  sync barrel loaded
PASS  entry query loaded
PASS  entry write loaded
PASS  oracle agrees with the real merge on a two-sided case
ALL PASS
```

### After — new behavior test

```
$ node scripts/check-sync-push-deny.mjs
# auth, owner and push-refusal fixes
PASS  the draft is gone after a clear — null
PASS  the entries are emptied
PASS  settings survive the clear (device preference, not another account's content) — {"displayName":"Alice","bio":"hi","avatar":"a.png"}
PASS  a foreign claim drops the draft — null
PASS  a foreign claim still drops the entries
PASS  a same-account claim keeps the draft — {"title":"mine"}
PASS  a rate limit keeps the server wording — For security purposes, you can only request this after 43 seconds.
PASS  an invalid email keeps the server wording
PASS  a failed fetch becomes the connection text
PASS  a network error becomes the connection text
PASS  an unknown throw becomes the connection text
PASS  an empty error message becomes the connection text
PASS  the adapter guards a non-empty push that accepted nothing — rows.length > 0 && accepted.length === 0
PASS  the guard throws a RemoteError naming the session
ALL PASS
```

### After — regression

```
$ node scripts/check-sync-storage.mjs
PASS  an equal-stamp import does not restore a deleted entry — same(tomb)
PASS  the import replaces a live entry — from import
PASS  the import adds a new entry
PASS  every service file is within 120 lines — all within limit
ALL PASS

$ node scripts/check-sync-race.mjs
PASS  the pass reports the whole batch as pushed — 2
PASS  an all-rejected push keeps both ids queued — {"a":"2026-09-01T10:00:00.000Z","b":"2026-09-01T10:00:00.000Z"}
PASS  the queue signature still lists both — a:2026-09-01T10:00:00.000Z|b:2026-09-01T10:00:00.000Z
PASS  the pass reports the whole batch as pushed — 2
ALL PASS   (45 PASS, 0 FAIL)

$ node scripts/check-sync-harness.mjs
PASS  sync barrel loaded
PASS  entry query loaded
PASS  entry write loaded
PASS  oracle agrees with the real merge on a two-sided case
ALL PASS

$ node scripts/check-sync-merge.mjs
PASS  the real merge matches the oracle on every case above — 24 cases agree
PASS  the real merge matches the oracle on the re-stamped tie cases — 1 cases agree
ALL PASS
```

### After — typecheck

```
$ npm run typecheck
> deardiary@1.0.0 typecheck
> tsc --noEmit --pretty false
(no output, exit 0)
```

### Line limits

```
$ wc -l src/services/supabase/*.ts src/services/sync/owner.ts src/store/syncStore.ts src/services/entryFields.ts
   91 src/services/supabase/adapter.ts
  118 src/services/supabase/auth.ts
   34 src/services/supabase/client.ts
   26 src/services/supabase/config.ts
    6 src/services/supabase/index.ts
   75 src/services/supabase/mapper.ts
   58 src/services/sync/owner.ts
  197 src/store/syncStore.ts
  119 src/services/entryFields.ts
  724 total
```
All services <= 120. `syncStore.ts` 197 <= 200 (unchanged). No file over 200.

## Handoff

- **F2 needs W2-UI.** `SyncSignIn.run` currently shows a static
  `'Could not reach the server. Check your connection and try again.'` for every error
  (`src/pages/Settings/sections/SyncSignIn.tsx:47,59`). W2-UI must replace that with
  `authFailureMessage(error)`. Signature: `authFailureMessage(error: unknown): string`.
  Defined at `src/services/supabase/auth.ts:43`, re-exported at
  `src/services/supabase/adapter.ts:9`. `SyncSignIn` was NOT edited by W2-AUTH.
  Suggested use: `run(async () => { ... }, null)` becomes a per-error message, e.g.
  catch `(error) => toast.error(authFailureMessage(error))`.
- **F3 has no automated behavioral test.** `supabaseAdapter.push` needs a live Supabase
  client, and `adapter.ts` does not even load under plain Node (its `EntryRow` is a
  type-only named import, which Node's ESM loader rejects at link time:
  `The requested module './mapper' does not provide an export named 'EntryRow'`). The
  guard is therefore asserted against the source text only and left for a manual Wave 3
  check. No green was faked.
- **P2 findings NOT fixed (out of scope):**
  1. `resume` uses the local `getSession` only — a revoked-but-not-expired session is
     still reported as signed in until the next real call fails.
  2. Race between sign-out and a pass in flight — a push started before `signOut` can
     still settle after the account is cleared.
  3. `verifyCode` has no `enabled()` guard (unlike `requestCode`).
  4. `onAuthChange` unsubscribe is racy — the subscription may not exist yet when the
     returned cleanup runs (the `void promise.then(...)` assigns it asynchronously).
  5. `pendingCount` is not reactive, so the UI cannot re-render on queue changes.
  6. `restore` catch sets `status: 'offline'` with `account: null`, so an offline restore
     shows offline with no account rather than a distinct "session unknown" state.
