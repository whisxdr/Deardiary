/**
 * Tombstone and owner durability, run against the real `src/services/entryWrite.ts` and
 * `src/services/sync/owner.ts`.
 *
 * The re-enabled model keeps a deletion as a tombstone (`deletedAt`) so it can travel to
 * another device, and keeps the entries that belong to one account out of another's. Both
 * are storage rules a browser test can only sample; here every branch is checked directly.
 *
 * Run: `node scripts/check-sync-storage.mjs`
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  claimDevice,
  clearLocalEntries,
  clearStorage,
  entry,
  entryWrite,
  hasPendingUpload,
  isForeignAccount,
  listAllRecords,
  listEntries,
  readOutbox,
  readOwner,
  reporter,
  STORAGE_KEY,
  seedRaw,
} from './check-sync-harness.mjs';

const { check, report } = reporter('sync storage and ownership');
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const rawIds = () => {
  const raw = globalThis.localStorage.getItem(STORAGE_KEY.entries);
  return raw ? JSON.parse(raw).map((item) => item.id + (item.deletedAt ? '(tomb)' : '')) : [];
};
const tombstoned = (id) => {
  const raw = globalThis.localStorage.getItem(STORAGE_KEY.entries);
  const record = raw ? JSON.parse(raw).find((item) => item.id === id) : undefined;
  return typeof record?.deletedAt === 'string';
};

// --- 1. A delete leaves a tombstone, not a missing record ---------------------------
{
  clearStorage();
  seedRaw([entry('gone'), entry('kept')]);
  const ok = entryWrite.deleteEntry('gone');
  check('deleteEntry reports success', ok === true);
  check('the deleted record is still stored as a tombstone', tombstoned('gone'), rawIds().join(','));
  check('the deleted record is hidden from listEntries', !listEntries().some((item) => item.id === 'gone'));
  check('the deleted record is still in listAllRecords', listAllRecords().some((item) => item.id === 'gone'));
  check('the surviving entry is untouched', listEntries().some((item) => item.id === 'kept'));
  check('the deletion is queued for upload', readOutbox().gone !== undefined, JSON.stringify(readOutbox()));
}

// --- 2. A second delete of the same id is a no-op -----------------------------------
{
  clearStorage();
  seedRaw([entry('twice')]);
  check('the first delete succeeds', entryWrite.deleteEntry('twice') === true);
  check('the second delete is refused', entryWrite.deleteEntry('twice') === false);
}

// --- 3. A deleted entry cannot be edited back to life -------------------------------
{
  clearStorage();
  seedRaw([entry('closed')]);
  entryWrite.deleteEntry('closed');
  const updated = entryWrite.updateEntry('closed', { title: 'resurrected' });
  check('updateEntry refuses a tombstoned entry', updated === null, JSON.stringify(updated));
  check('the tombstone is unchanged', tombstoned('closed'));
}

// --- 4. A tombstone survives an unrelated mutation ----------------------------------
{
  // The re-enabled write path reads the whole record list (tombstones included) and writes
  // it back, so an unrelated create must not drop a tombstone. The reverted model filtered
  // tombstones out on read, which is exactly what erased them on the next write.
  clearStorage();
  seedRaw([entry('dead', { deletedAt: '2026-09-01T00:00:00.000Z' }), entry('live')]);
  entryWrite.createEntry({ title: 'unrelated', content: '<p>new</p>' });
  check('the tombstone survives an unrelated create', tombstoned('dead'), rawIds().join(','));
  check('the tombstone stays hidden after the create', !listEntries().some((item) => item.id === 'dead'));

  entryWrite.updateEntry('live', { title: 'edited' });
  check('the tombstone survives an unrelated edit', tombstoned('dead'), rawIds().join(','));

  entryWrite.deleteEntry('live');
  check('the tombstone survives another delete', tombstoned('dead'), rawIds().join(','));
  check('both tombstones are present', rawIds().filter((id) => id.endsWith('(tomb)')).length === 2, rawIds().join(','));
}

// --- 5. Clear all writes tombstones, not an empty array -----------------------------
{
  clearStorage();
  seedRaw([entry('a'), entry('b')]);
  entryWrite.deleteAllEntries();
  check('clear all writes tombstones for every entry', rawIds().filter((id) => id.endsWith('(tomb)')).length === 2, rawIds().join(','));
  check('clear all leaves no visible entry', listEntries().length === 0);
  check('clear all keeps the records for sync', listAllRecords().length === 2);
  check('clear all queues every tombstone', Object.keys(readOutbox()).length === 2, JSON.stringify(readOutbox()));
}

// --- 6. Clear all does not touch an existing tombstone's stamp ----------------------
{
  clearStorage();
  seedRaw([entry('old', { deletedAt: '2026-01-01T00:00:00.000Z' }), entry('new')]);
  entryWrite.deleteAllEntries();
  const raw = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY.entries));
  const old = raw.find((item) => item.id === 'old');
  check('an existing tombstone keeps its original stamp', old.deletedAt === '2026-01-01T00:00:00.000Z', old.deletedAt);
}

// --- 7. A pull that brings a tombstone removes the entry ----------------------------
{
  // The merge result is written straight to storage; the write path must not resurrect a
  // record whose remote copy is a newer tombstone.
  clearStorage();
  seedRaw([entry('shared', { updatedAt: '2026-09-01T00:00:00.000Z' })]);
  entryWrite.replaceEntries([
    entry('shared', { updatedAt: '2026-09-05T00:00:00.000Z', deletedAt: '2026-09-05T00:00:00.000Z' }),
  ]);
  check('a pulled tombstone is written to storage', tombstoned('shared'), rawIds().join(','));
  check('a pulled tombstone hides the entry', !listEntries().some((item) => item.id === 'shared'));
}

// --- 8. Owner isolation: a second account does not inherit the first's diary --------
{
  clearStorage();
  // Alice writes offline and signs in; the entries are adopted and claimed.
  seedRaw([entry('alice-note')]);
  claimDevice('alice-id');
  check('the first account claims the device', readOwner() === 'alice-id', String(readOwner()));
  check('the adopted entries are kept', listAllRecords().length === 1, rawIds().join(','));

  // Alice signs out: the owner key stays, so the next sign-in can tell whose diary this is.
  // (Sign-out is a store action; the owner key is not cleared by it.)
  check('a different account is detected as foreign', isForeignAccount('bob-id'));
  check('the same account is not foreign', !isForeignAccount('alice-id'));
}

// --- 9. A foreign sign-in drops the previous account's diary and queue --------------
{
  clearStorage();
  seedRaw([entry('alice-secret')]);
  // Owner and outbox are written through `writeJson`, so they are JSON values, not raw
  // strings. Seeding them raw would make `readJson` fall back to null and look like the
  // owner key was never set — the exact case this test must not confuse itself with.
  globalThis.localStorage.setItem(STORAGE_KEY.owner, JSON.stringify('alice-id'));
  globalThis.localStorage.setItem(STORAGE_KEY.outbox, JSON.stringify({ 'alice-secret': '2026-09-01T00:00:00.000Z' }));
  check('the foreign owner is read back', readOwner() === 'alice-id', String(readOwner()));

  claimDevice('bob-id');

  check("the previous account's entries are dropped", listAllRecords().length === 0, rawIds().join(',') || 'none');
  check("the previous account's queue is dropped", Object.keys(readOutbox()).length === 0, JSON.stringify(readOutbox()));
  check('the device is claimed for the new account', readOwner() === 'bob-id', String(readOwner()));
  check('nothing is pending upload after the switch', !hasPendingUpload());
}

// --- 10. A missing owner key adopts offline entries rather than destroying them -----
{
  clearStorage();
  seedRaw([entry('written-before-signup')]);
  // No owner key: this person wrote first and is making an account second. Adopting the
  // entries is the whole point of signing in; clearing them is the worst possible reading.
  claimDevice('new-id');
  check('offline entries are adopted on first sign-in', listAllRecords().length === 1, rawIds().join(','));
  check('the device is claimed', readOwner() === 'new-id');
}

// --- 11. clearLocalEntries empties both the collection and the queue ----------------
{
  clearStorage();
  seedRaw([entry('x'), entry('y')]);
  globalThis.localStorage.setItem(STORAGE_KEY.outbox, JSON.stringify({ x: 't', y: 't' }));
  clearLocalEntries();
  check('clearLocalEntries empties the collection', listAllRecords().length === 0, rawIds().join(',') || 'none');
  check('clearLocalEntries empties the queue', Object.keys(readOutbox()).length === 0, JSON.stringify(readOutbox()));
}

// --- 12. The outbox survives a reload (it is storage, not memory) -------------------
{
  clearStorage();
  seedRaw([entry('persist')]);
  entryWrite.deleteEntry('persist');
  const queue = readOutbox();
  check('the queue is written to storage', queue.persist !== undefined, JSON.stringify(queue));
  check(
    'the queue stamp matches the tombstone stamp',
    queue.persist === JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY.entries)).find((item) => item.id === 'persist').updatedAt,
  );
}

// --- 13. A deletion scrubs the user body so no plaintext is left behind -------------
{
  clearStorage();
  seedRaw([
    entry('secret', {
      title: 'Private thoughts',
      content: '<p>the actual diary words</p>',
      tags: ['diary', 'personal'],
      location: 'Home',
      images: ['photo.png'],
    }),
  ]);
  entryWrite.deleteEntry('secret');

  const raw = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEY.entries)).find((item) => item.id === 'secret');
  check('the tombstone keeps the id', raw.id === 'secret', raw.id);
  check('the tombstone keeps the deleted stamp', typeof raw.deletedAt === 'string', raw.deletedAt);
  check('the tombstone keeps a valid updated stamp', typeof raw.updatedAt === 'string', raw.updatedAt);
  check('the deleted body is scrubbed', raw.content === '', JSON.stringify(raw.content));
  check('the deleted title is scrubbed', raw.title === '', JSON.stringify(raw.title));
  check('the deleted tags are scrubbed', Array.isArray(raw.tags) && raw.tags.length === 0, JSON.stringify(raw.tags));
  check('the deleted location is scrubbed', raw.location === undefined, JSON.stringify(raw.location));
  check('the deleted images are scrubbed', raw.images === undefined, JSON.stringify(raw.images));
  check(
    'no plaintext of the deleted entry remains in storage',
    !globalThis.localStorage.getItem(STORAGE_KEY.entries).includes('the actual diary words'),
  );
}

// --- 14. Clear all scrubs every tombstone it writes ---------------------------------
{
  clearStorage();
  seedRaw([entry('a', { content: '<p>alpha words</p>' }), entry('b', { content: '<p>beta words</p>' })]);
  entryWrite.deleteAllEntries();
  const store = globalThis.localStorage.getItem(STORAGE_KEY.entries);
  const raw = JSON.parse(store);
  check('every tombstone body is scrubbed', raw.every((item) => item.content === ''), raw.map((i) => i.content).join('|'));
  check('no cleared plaintext remains', !store.includes('alpha words') && !store.includes('beta words'));
}

// --- 15. An import cannot erase a pending tombstone ---------------------------------
{
  clearStorage();
  // A deletion is pending locally; the backup was exported before it and does not carry it.
  seedRaw([entry('gone', { updatedAt: '2026-09-01T00:00:00.000Z', deletedAt: '2026-09-01T00:00:00.000Z' })]);
  // The import brings back the live record at its old stamp (exported before the delete).
  entryWrite.replaceEntries([entry('gone', { updatedAt: '2026-08-01T00:00:00.000Z' })]);
  check(
    'an older live record in the import does not resurrect the deleted entry',
    tombstoned('gone'),
    rawIds().join(','),
  );
  check('the deleted entry stays hidden after the import', !listEntries().some((item) => item.id === 'gone'));
}

// --- 16. An import may restore a deleted entry only with a strictly newer stamp ------
{
  clearStorage();
  seedRaw([entry('revive', { updatedAt: '2026-09-01T00:00:00.000Z', deletedAt: '2026-09-01T00:00:00.000Z' })]);
  entryWrite.replaceEntries([entry('revive', { updatedAt: '2026-09-05T00:00:00.000Z', title: 'back again' })]);
  check('a newer explicit record restores the entry', !tombstoned('revive'), rawIds().join(','));
  check('the restored entry is visible', listEntries().some((item) => item.id === 'revive'));
}

// --- 17. An import equal in stamp to a tombstone does not restore it ----------------
{
  clearStorage();
  seedRaw([entry('same', { updatedAt: '2026-09-01T00:00:00.000Z', deletedAt: '2026-09-01T00:00:00.000Z' })]);
  entryWrite.replaceEntries([entry('same', { updatedAt: '2026-09-01T00:00:00.000Z' })]);
  check('an equal-stamp import does not restore a deleted entry', tombstoned('same'), rawIds().join(','));
}

// --- 18. A normal import still replaces live entries --------------------------------
{
  clearStorage();
  seedRaw([entry('keep', { title: 'old' })]);
  entryWrite.replaceEntries([entry('keep', { title: 'from import' }), entry('added')]);
  const kept = listAllRecords().find((item) => item.id === 'keep');
  check('the import replaces a live entry', kept.title === 'from import', kept.title);
  check('the import adds a new entry', listAllRecords().some((item) => item.id === 'added'));
}

// --- 19. Service files stay inside the project's line limit -------------------------
{
  // The services limit is 120 lines. The sync and write paths were split to stay under it,
  // and this pins that: a growing file is a signal to split, not to raise the limit.
  const services = [
    'entryWrite.ts',
    'entryQuery.ts',
    'entryService.ts',
    'sync/merge.ts',
    'sync/engine.ts',
    'sync/outbox.ts',
    'sync/clock.ts',
    'sync/owner.ts',
    'sync/types.ts',
    'supabase/adapter.ts',
    'supabase/mapper.ts',
  ];
  const over = services.filter((rel) => {
    const text = readFileSync(join(ROOT, 'src', 'services', rel), 'utf8');
    return text.split('\n').filter((line, index, all) => index < all.length - 1 || line !== '').length > 120;
  });
  check('every service file is within 120 lines', over.length === 0, over.join(', ') || 'all within limit');
}

process.exit(report() === 0 ? 0 : 1);
