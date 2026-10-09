/**
 * The entry write path, run against the app's real `src/` services.
 *
 * Guards the data rules that the removal of the sync build settled, each of which was
 * once broken and silent:
 *
 *   1. A legacy `deletedAt` tombstone is dropped on read, not resurrected as a blank
 *      entry (the previous build kept deleted entries as scrubbed records).
 *   2. Delete removes the record outright; clear-all writes an empty collection.
 *   3. A new entry keeps the favorite and private flags the composer sends — they used
 *      to be hardcoded false at publish.
 *   4. Two writes inside the same millisecond get different stamps, so the optimistic
 *      guard in `updateEntry` can still tell one version from another.
 *   5. Hydrating the store clears the removed sync build's leftover keys.
 *
 * Pure Node, no browser: it belongs in `npm test` so a regression fails CI rather than
 * showing up as a mysterious blank card on someone's dashboard.
 *
 * Run: `node scripts/check-entry-writes.mjs`
 */
import { entry, loadSrc, reporter } from './check-harness.mjs';

const storage = globalThis.localStorage;
const { listAllRecords, listEntries, saveEntries } = await loadSrc('services/entryQuery.ts');
const entryWrite = await loadSrc('services/entryWrite.ts');
const { useEntryStore } = await loadSrc('store/entryStore.ts');
const { LEGACY_SYNC_KEYS } = await loadSrc('constants/storageKeys.ts');

const { check, report } = reporter('entry write path');

/** Seeds the raw stored list, bypassing any repair. */
function seed(list) {
  storage.setItem('deardiary:entries', JSON.stringify(list));
}

function rawEntries() {
  return JSON.parse(storage.getItem('deardiary:entries') ?? '[]');
}

// --- 1. Legacy tombstones are dropped, not resurrected ---------------------------------
seed([
  entry('live-1', { title: 'Keep me' }),
  // What the removed sync build wrote for a deletion: scrubbed fields plus a stamp.
  entry('gone-1', { title: '', content: '', tags: [], deletedAt: '2026-10-01T00:00:00.000Z' }),
]);
let listed = listEntries();
check('a legacy tombstone is not listed', !listed.some((item) => item.id === 'gone-1'), listed.map((i) => i.id).join(','));
check('the live entry survives the migration', listed.some((item) => item.id === 'live-1'));
let stored = rawEntries();
check('the tombstone is rewritten out of storage', !stored.some((item) => item.deletedAt !== undefined), stored.map((i) => i.id).join(','));

// --- 2. Delete and clear-all remove records --------------------------------------------
check('deleteEntry removes the record', entryWrite.deleteEntry('live-1') && rawEntries().length === 0);
seed([entry('a'), entry('b')]);
check('deleteAllEntries writes an empty collection', entryWrite.deleteAllEntries() && rawEntries().length === 0);
check('deleteEntry on a missing id reports false', entryWrite.deleteEntry('missing') === false);

// --- 3. A new entry keeps the flags the composer sends ---------------------------------
{
  storage.clear();
  const created = entryWrite.createEntry({ title: 'T', content: '<p>body</p>', isFavorite: true, isPrivate: true });
  check('a private new entry is stored private', created.isPrivate === true, `isPrivate=${created.isPrivate}`);
  check('a favorited new entry is stored favorited', created.isFavorite === true, `isFavorite=${created.isFavorite}`);
  check('the flags reached storage', rawEntries()[0].isPrivate === true && rawEntries()[0].isFavorite === true);
}

// --- 3b. An import cannot resurrect a deleted entry ------------------------------------
{
  storage.clear();
  // A backup written while both entries existed.
  const backup = [entry('kept-2'), entry('doomed-2')];
  const created = entryWrite.createEntry({ title: 'Doomed', content: '<p>words</p>' });
  entryWrite.deleteEntry(created.id);
  check('the deleted id is remembered', JSON.parse(storage.getItem('deardiary:deleted-ids')).includes(created.id));
  entryWrite.replaceEntries(backup);
  const afterImport = rawEntries().map((item) => item.id);
  check('the deleted entry stays gone after import', !afterImport.includes(created.id), afterImport.join(','));
  check("the backup's other entries import", afterImport.includes('kept-2') && afterImport.includes('doomed-2'));
}

// --- 4. Same-millisecond writes get different stamps ------------------------------------
{
  storage.clear();
  const created = entryWrite.createEntry({ title: 'T', content: '<p>body</p>' });
  const first = entryWrite.updateEntry(created.id, { title: 'one' });
  const second = entryWrite.updateEntry(created.id, { title: 'two' });
  check('two writes share no stamp', first.updatedAt !== second.updatedAt, `${first.updatedAt} vs ${second.updatedAt}`);
  check(
    'the guard rejects a write against the old stamp',
    entryWrite.updateEntry(created.id, { title: 'stale' }, first.updatedAt) === null,
  );
}

// --- 5. Hydrate clears the removed sync build's leftover keys ---------------------------
{
  storage.clear();
  seed([entry('solo-1')]);
  LEGACY_SYNC_KEYS.forEach((key) => storage.setItem(key, 'leftover'));
  useEntryStore.getState().hydrate();
  check(
    'hydrate clears the legacy sync keys',
    LEGACY_SYNC_KEYS.every((key) => storage.getItem(key) === null),
    LEGACY_SYNC_KEYS.filter((key) => storage.getItem(key) !== null).join(','),
  );
  check('hydrate still lists the entry', useEntryStore.getState().entries.length === 1);
}

process.exit(report() === 0 ? 0 : 1);
