# Cloud sync

The diary works entirely offline and without an account. Signing in turns on sync
between devices: write on a laptop, open it on a phone, see the same entries.

## How it fits together

```
localStorage  <--  entryQuery / entryWrite  <--  UI
     |                    |
     |                    +--> outbox: entry ids changed locally, not yet uploaded
     |
     +--> sync/engine.ts  --pull-->  adapter.pull()   (server state)
                     |
                     +-- merge.ts: union by id, later updatedAt wins
                     |
                     +--push-->  adapter.push()   (only what this device won)
```

Nothing in the entry service knows about the network. A write is a synchronous
localStorage call, always. Uploading happens afterwards, from a store subscription.

**That is a correctness requirement, not a style choice.** The composer flushes pending
edits on `pagehide`, when the browser is tearing the page down: any `await` in that path
is dropped, so a network call there would silently lose the last thing the user typed.

## Why the pieces are shaped this way

**Tombstones.** `deleteEntry` stamps `deletedAt` instead of removing the record. A removed
record is indistinguishable from one that was never uploaded, so a delete could not travel
and the entry reappeared on the next pull. The same reasoning covers "Clear all entries",
which writes tombstones for every entry rather than an empty array.

**The outbox.** A set of ids, not a queue of payloads: repeated edits to one entry collapse
into a single pending push, and the server only needs the latest state of each id.

**Merge is a union keyed on id.** This is what makes the order of sign-in irrelevant — a
device that signs in first does not overwrite one that signs in later, and neither side's
entries are dropped. It is a pure function so the rules can be tested directly rather than
only through a browser: `node scripts/check-sync-merge.mjs`.

**The conflict stamp is a snapshot.** `useWriteForm` holds the `updatedAt` the form
*loaded*, not a live read of the store. A background pull updates the store; following it
live would hand the conflict guard a fresh stamp while the form still held older text, so
the next autosave would overwrite the pulled version with stale words.

**Session in an httpOnly cookie.** The account object holds only an email. A bearer token
in localStorage is readable by any injected script; a cookie the page cannot read is not.

## Running it locally

```bash
npm run build
node scripts/serve-sync.mjs     # http://localhost:5213
```

`serve-sync.mjs` serves `dist` with the production header set and answers the `/api`
routes. It prints the sign-in code to its console, because there is no mail server — that
is what makes the flow testable end to end.

Then:

```bash
node scripts/check-sync-e2e.mjs   # two isolated browser profiles, 18 checks
```

## What is NOT production-ready here

`scripts/serve-sync.mjs` is a test fixture. Before pointing real users at anything like it:

- **Rate limiting.** Nothing stops unlimited code requests per address. Without it the
  sign-in endpoint is a way to send mail to strangers.
- **Code attempt limiting.** A six-digit code is brute-forceable if attempts are free.
  Count failures per email and lock out.
- **A real mail provider.** The code is printed to a console today.
- **Backups and migrations.** `.sync-data/store.json` is a single file.
- **Content Security Policy.** `connect-src 'self'` in `vercel.json` only allows same-origin
  requests. A backend on another origin requires widening it to that origin, which is a
  real reduction in protection and should be a deliberate decision.
- **Privacy.** Entries are stored in plaintext server-side. `isPrivate` currently hides an
  entry locally; over sync it means nothing unless the body is encrypted end-to-end, and
  encrypting it would break search, Stats and Calendar for those entries.

## Adding a different backend

Implement `RemoteAdapter` from `src/services/sync/types.ts` and pass it to
`createSyncStore(adapter)` in `src/store/syncStore.ts`. The engine, the merge and the UI
do not change.
