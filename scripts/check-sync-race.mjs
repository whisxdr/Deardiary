/**
 * Sync race conditions, run against the real engine and outbox with a stub adapter.
 *
 * Each case is a way a concurrent write could be lost or a queued change stranded. The
 * engine is driven directly rather than through a browser, so the race is held open with a
 * deferred promise instead of a network delay: no server, no timing guesswork, and the
 * exact interleaving is the test's to choose.
 *
 * Run: `node scripts/check-sync-race.mjs`
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  clearStorage,
  clearUploaded,
  deferred,
  entry,
  enqueue,
  entryWrite,
  listAllRecords,
  listEntries,
  outboxSignature,
  pendingCount,
  readOutbox,
  reporter,
  seedRaw,
  stubAdapter,
  syncNow,
} from './check-sync-harness.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const { check, report } = reporter('sync races');

const account = { id: 'user-1', email: 'a@example.com' };
const ids = () => listAllRecords().map((item) => item.id);
const liveTitles = () => listEntries().map((item) => item.title);

// --- 1. Outbox compare-and-delete keeps a write that landed after the push ----------
{
  clearStorage();
  enqueue('a', 'stamp-old');
  // The upload that started with the old stamp finishes, but the entry was edited in the
  // meantime, so the outbox now holds a newer stamp. Deleting on the id alone would strand
  // that edit locally forever.
  enqueue('a', 'stamp-new');
  clearUploaded({ a: 'stamp-old' });
  check('a stale-stamp clear leaves the newer change queued', readOutbox().a === 'stamp-new', JSON.stringify(readOutbox()));

  clearUploaded({ a: 'stamp-new' });
  check('a matching-stamp clear removes the change', readOutbox().a === undefined, JSON.stringify(readOutbox()));
}

// --- 2. Compare-and-delete only touches the ids it uploaded -------------------------
{
  clearStorage();
  enqueue('keep', 'k1');
  enqueue('drop', 'd1');
  clearUploaded({ drop: 'd1' });
  check('an unrelated queued change is untouched', readOutbox().keep === 'k1' && readOutbox().drop === undefined);
}

// --- 3. A write made during the pull survives the write-back ------------------------
{
  clearStorage();
  seedRaw([entry('baseline', { updatedAt: '2026-09-01T00:00:00.000Z' })]);
  // The pull is held open. Its answer already carries an entry this device has never seen,
  // which is what makes the merge write back — the window the old engine erased.
  const gate = deferred();
  const adapter = stubAdapter({
    pull: () => gate.promise,
    push: async () => {},
  });

  const pass = syncNow(adapter, account);
  // Land a local write while the pull is in flight, through the real write path.
  const during = entryWrite.createEntry({ title: 'Written during the pull', content: '<p>must survive</p>' });
  check('the local write is stored while the pull is pending', ids().includes(during.id), ids().join(','));

  gate.resolve({ entries: [entry('from-server', { updatedAt: '2026-09-02T00:00:00.000Z' })], serverTime: '' });
  await pass;

  check(
    'the write made during the pull is not erased by the write-back',
    ids().includes(during.id),
    ids().join(','),
  );
  check('the baseline entry survives', ids().includes('baseline'), ids().join(','));
  check("the server's entry arrives", ids().includes('from-server'), ids().join(','));
  check('nothing was lost', ids().length === 3, ids().join(','));
}

// --- 4. A write made during the push stays queued for the next pass -----------------
{
  clearStorage();
  seedRaw([entry('owned', { updatedAt: '2026-09-01T00:00:00.000Z' })]);
  enqueue('owned', '2026-09-01T00:00:00.000Z');

  const gate = deferred();
  const pushed = [];
  const adapter = stubAdapter({
    pull: async () => ({ entries: [entry('remote', { updatedAt: '2026-09-05T00:00:00.000Z' })], serverTime: '' }),
    push: async (_account, list) => {
      pushed.push(...list.map((item) => item.id));
      await gate.promise;
    },
  });

  const pass = syncNow(adapter, account);
  // Let the pull and merge settle, then land a write while the push is held open.
  await new Promise((resolve) => setTimeout(resolve, 0));
  const duringPush = entryWrite.createEntry({ title: 'During push', content: '<p>late</p>' });

  gate.resolve();
  await pass;

  check('the entry queued before the pass was uploaded', pushed.includes('owned'), pushed.join(','));
  check(
    'a write made during the push is still queued afterwards',
    readOutbox()[duringPush.id] === duringPush.updatedAt,
    JSON.stringify(readOutbox()),
  );
  check('the write made during the push is not lost', ids().includes(duringPush.id), ids().join(','));
}

// --- 5. A failed push leaves the queue intact so the next pass retries --------------
{
  clearStorage();
  seedRaw([entry('retry', { updatedAt: '2026-09-01T00:00:00.000Z' })]);
  enqueue('retry', '2026-09-01T00:00:00.000Z');

  const adapter = stubAdapter({
    pull: async () => ({ entries: [], serverTime: '' }),
    push: async () => {
      throw new Error('The server could not be reached.');
    },
  });

  const result = await syncNow(adapter, account);
  check('the pass reports the failure', Boolean(result.error), result.error);
  check('the queued change is kept for a retry', readOutbox().retry !== undefined, JSON.stringify(readOutbox()));
  check('the entry itself is untouched', ids().includes('retry'), ids().join(','));
}

// --- 6. A failed pull changes nothing ----------------------------------------------
{
  clearStorage();
  seedRaw([entry('safe', { updatedAt: '2026-09-01T00:00:00.000Z' })]);
  const adapter = stubAdapter({
    pull: async () => {
      throw new Error('offline');
    },
  });
  const result = await syncNow(adapter, account);
  check('a failed pull is reported', Boolean(result.error));
  check('a failed pull leaves the collection intact', ids().join(',') === 'safe', ids().join(','));
}

// --- 7. Two concurrent passes do not double-clear or strand the queue ---------------
{
  clearStorage();
  seedRaw([entry('shared', { updatedAt: '2026-09-01T00:00:00.000Z' })]);
  enqueue('shared', '2026-09-01T00:00:00.000Z');
  const pushed = [];
  const adapter = stubAdapter({
    pull: async () => ({ entries: [], serverTime: '' }),
    push: async (_account, list) => {
      pushed.push(...list.map((item) => item.id));
    },
  });

  // Both passes see the same queued id. The compare-and-delete is idempotent, so the
  // second clear finds nothing and neither pass corrupts the queue.
  await Promise.all([syncNow(adapter, account), syncNow(adapter, account)]);
  check('the queue drains after the concurrent passes', pendingCount() === 0, JSON.stringify(readOutbox()));
  check('the queue signature is empty', outboxSignature() === '', outboxSignature());
}

// --- 8. The signature tracks a re-edit of the same id -------------------------------
{
  clearStorage();
  enqueue('one', 'v1');
  const first = outboxSignature();
  enqueue('one', 'v2');
  check('re-editing one id changes the signature', outboxSignature() !== first, `${first} -> ${outboxSignature()}`);
  check('the signature is order-independent', (() => {
    clearStorage();
    enqueue('a', '1');
    enqueue('b', '2');
    const forward = outboxSignature();
    clearStorage();
    enqueue('b', '2');
    enqueue('a', '1');
    return forward === outboxSignature();
  })());
}

// --- 9. The clock steps forward so a second write is strictly newer -----------------
{
  clearStorage();
  const first = entryWrite.createEntry({ title: 'one', content: '<p>one</p>' });
  const second = entryWrite.createEntry({ title: 'two', content: '<p>two</p>' });
  check(
    'a later write gets a strictly later stamp',
    new Date(second.updatedAt).getTime() > new Date(first.updatedAt).getTime(),
    `${first.updatedAt} -> ${second.updatedAt}`,
  );
}

// --- 10. A pulled stamp in the future is adopted, not overtaken ---------------------
{
  clearStorage();
  const future = '2030-01-01T00:00:00.000Z';
  const adapter = stubAdapter({ pull: async () => ({ entries: [entry('future', { updatedAt: future })], serverTime: '' }) });
  await syncNow(adapter, account);
  const after = entryWrite.createEntry({ title: 'after pull', content: '<p>after</p>' });
  check(
    'a write after pulling a future stamp lands after it',
    new Date(after.updatedAt).getTime() > new Date(future).getTime(),
    `${future} -> ${after.updatedAt}`,
  );
}

// --- 11. A local copy that loses to a remote winner clears its exact queued stamp ----
{
  clearStorage();
  const local = entry('lose', { updatedAt: '2026-09-01T00:00:00.000Z', content: '<p>old</p>' });
  seedRaw([local]);
  enqueue('lose', local.updatedAt);
  const remote = entry('lose', { updatedAt: '2026-09-05T00:00:00.000Z', content: '<p>new</p>' });
  const adapter = stubAdapter({ pull: async () => ({ entries: [remote], serverTime: '' }) });

  await syncNow(adapter, account);

  check('the remote winner is stored', listAllRecords()[0].content === '<p>new</p>', listAllRecords()[0].content);
  check(
    'the losing local copy is cleared from the queue',
    readOutbox().lose === undefined,
    JSON.stringify(readOutbox()),
  );
}

// --- 12. A local edit landing after the merge read survives the remote-won clear -----
{
  clearStorage();
  // `x` is queued at the stamp the merge will consider; the remote copy is newer, so the
  // remote wins and the merge settles `x` at the considered stamp. `y` is local-only and is
  // what holds the push open.
  seedRaw([entry('x', { updatedAt: '2026-09-01T00:00:00.000Z', content: '<p>old</p>' }), entry('y')]);
  enqueue('x', '2026-09-01T00:00:00.000Z');
  enqueue('y', '2026-09-01T00:00:00.000Z');

  const gate = deferred();
  const adapter = stubAdapter({
    pull: async () => ({
      entries: [entry('x', { updatedAt: '2026-09-02T00:00:00.000Z', content: '<p>server</p>' })],
      serverTime: '',
    }),
    push: async () => {
      await gate.promise;
    },
  });

  const pass = syncNow(adapter, account);
  // Let the pull and merge settle, then land a fresh edit on `x` while the push is open.
  await new Promise((resolve) => setTimeout(resolve, 0));
  const late = entryWrite.updateEntry('x', { content: '<p>late local</p>' });
  check('the late edit is stored during the push', late !== null && late.content === '<p>late local</p>');

  gate.resolve();
  await pass;

  // The merge settled `x` at the older stamp it considered; the queue now holds the late
  // edit's newer stamp, so the compare-and-delete must skip it and keep the edit queued.
  check(
    'the late edit stays queued instead of being cleared by the remote win',
    readOutbox().x === late.updatedAt,
    JSON.stringify(readOutbox()),
  );
  check('the late edit is not lost', listAllRecords().find((item) => item.id === 'x').content === '<p>late local</p>');
}

// --- 13. A field-only tie converges through the engine and drains the queue ----------
{
  clearStorage();
  // This device holds the winning copy of a same-stamp tie (`sad` sorts above `happy`).
  const shared = '2026-09-01T00:00:00.000Z';
  seedRaw([entry('tie', { mood: 'sad', updatedAt: shared })]);
  enqueue('tie', shared);
  const remote = entry('tie', { mood: 'happy', updatedAt: shared });
  const pushed = [];
  const adapter = stubAdapter({
    pull: async () => ({ entries: [remote], serverTime: '' }),
    push: async (_account, list) => {
      pushed.push(...list.map((item) => item.id));
    },
  });

  await syncNow(adapter, account);

  const stored = listAllRecords().find((item) => item.id === 'tie');
  check('the local tie winner is kept', stored.mood === 'sad', stored.mood);
  check(
    'the tie winner is re-stamped past the shared stamp',
    new Date(stored.updatedAt).getTime() > new Date(shared).getTime(),
    stored.updatedAt,
  );
  check('the re-stamped winner is uploaded', pushed.includes('tie'), pushed.join(','));
  check('the tie drains the queue', pendingCount() === 0, JSON.stringify(readOutbox()));
  check('the queue signature is empty', outboxSignature() === '', outboxSignature());
}

// --- 14. The upsert RPC reports what it accepted, so a tie is not silently dropped ---
{
  const sql = readFileSync(join(ROOT, 'supabase', 'migrations', '20261001000000_entries.sql'), 'utf8');
  check(
    'the RPC returns the accepted ids',
    /create or replace function public\.upsert_entries\(p_rows jsonb\)\s*returns setof text/i.test(sql),
    'returns setof text',
  );
  check('the RPC returns the accepted rows', /\breturning id\b/i.test(sql));
  check(
    'the stale-write guard is still present',
    /where public\.entries\.updated_at < excluded\.updated_at/i.test(sql),
  );
}

// --- 15. The pull pages past PostgREST's 1000-row cap ------------------------------
{
  const source = readFileSync(join(ROOT, 'src', 'services', 'supabase', 'adapter.ts'), 'utf8');
  check('the pull uses .range pagination', /\.range\(/.test(source), '.range');
  check('the pull loops until a short page ends the walk', /page\.length < PAGE/.test(source));
  check('the pull no longer caps at a single .limit(1000)', !/\.limit\(1000\)/.test(source));
}

// --- 16. A partial `accepted` keeps only the rejected ids queued ---------------------
{
  clearStorage();
  // Both are local-only, so the merge pushes both and settles both. The push accepts `a`
  // and rejects `b`: the server drops a row whose stamp is not strictly newer. The engine
  // must drop only the rejected id from `settled`, so `a` clears and `b` stays queued.
  seedRaw([entry('a'), entry('b')]);
  enqueue('a', entry('a').updatedAt);
  enqueue('b', entry('b').updatedAt);

  const adapter = stubAdapter({
    pull: async () => ({ entries: [], serverTime: '' }),
    push: async () => ['a'],
  });

  const result = await syncNow(adapter, account);
  check('the accepted id is cleared from the queue', readOutbox().a === undefined, JSON.stringify(readOutbox()));
  check('the rejected id stays queued for a retry', readOutbox().b === entry('b').updatedAt, JSON.stringify(readOutbox()));
  // Recorded as-is: the engine reports the whole outgoing batch as pushed, not the accepted
  // count. The queue, not `pushed`, is what carries the retry, so this is pinned not fixed.
  check('the pass reports the whole batch as pushed', result.pushed === 2, String(result.pushed));
}

// --- 17. An empty `accepted` keeps every id queued ----------------------------------
{
  clearStorage();
  seedRaw([entry('a'), entry('b')]);
  enqueue('a', entry('a').updatedAt);
  enqueue('b', entry('b').updatedAt);

  const adapter = stubAdapter({
    pull: async () => ({ entries: [], serverTime: '' }),
    push: async () => [],
  });

  const result = await syncNow(adapter, account);
  check('an all-rejected push keeps both ids queued', pendingCount() === 2, JSON.stringify(readOutbox()));
  check('the queue signature still lists both', outboxSignature().split('|').length === 2, outboxSignature());
  check('the pass reports the whole batch as pushed', result.pushed === 2, String(result.pushed));
}

process.exit(report() === 0 ? 0 : 1);
