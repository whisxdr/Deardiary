/**
 * Stamp spelling: the instant is the identity, not the string.
 *
 * The client stamps with `toISOString()` (`Z`, three-digit ms). PostgREST answers a
 * `timestamptz` in its own spelling (`+00:00`, trailing zeros trimmed). Two values with the
 * same instant but different spelling must be the same version of an entry, or the merge
 * re-pushes on every idle pass and a guarded edit is dropped. Run against the real
 * `src/services/entryFields.ts`, `src/services/sync/merge.ts` and `src/services/entryWrite.ts`.
 *
 * Run: `node scripts/check-sync-stamps.mjs`
 */
import {
  clearStorage,
  entry,
  entryWrite,
  listAllRecords,
  loadSrc,
  mergeEntries,
  readOutbox,
  reporter,
  seedRaw,
  stubAdapter,
  syncNow,
} from './check-sync-harness.mjs';

const { coerceEntry } = await loadSrc('services/entryFields.ts');

const { check, report } = reporter('sync stamp spelling');
const account = { id: 'user-1', email: 'a@example.com' };

/** How the server spells an instant: `+00:00`, trailing ms zeros trimmed. */
const serverSpelling = (iso) => {
  const at = new Date(iso);
  const ms = at.getUTCMilliseconds();
  const base = at.toISOString().slice(0, 19);
  return `${base}${ms ? `.${String(ms).padStart(3, '0').replace(/0+$/, '')}` : ''}+00:00`;
};

// --- 1. An `updatedAt` in `+00:00` is normalized to the canonical `Z` ----------------
{
  const coerced = coerceEntry(entry('u', { updatedAt: '2026-10-01T16:00:00+00:00' }));
  check(
    'updatedAt normalizes to the canonical Z spelling',
    coerced.updatedAt === '2026-10-01T16:00:00.000Z',
    coerced.updatedAt,
  );
}

// --- 2. date, createdAt and deletedAt are normalized the same way --------------------
{
  const coerced = coerceEntry(
    entry('n', {
      date: '2026-10-01T16:00:00+00:00',
      createdAt: '2026-10-01T15:30:00.1+00:00',
      updatedAt: '2026-10-01T16:00:00.100Z',
      deletedAt: '2026-10-01T17:00:00+00:00',
    }),
  );
  check('date normalizes to the canonical Z spelling', coerced.date === '2026-10-01T16:00:00.000Z', coerced.date);
  check(
    'createdAt normalizes trimmed-zero ms back to three digits',
    coerced.createdAt === '2026-10-01T15:30:00.100Z',
    coerced.createdAt,
  );
  check('deletedAt normalizes to the canonical Z spelling', coerced.deletedAt === '2026-10-01T17:00:00.000Z', coerced.deletedAt);

  const noStamp = coerceEntry(entry('d', { deletedAt: 'not-a-date' }));
  check('an unparsable deletedAt leaves the key absent', !('deletedAt' in noStamp), JSON.stringify(noStamp.deletedAt));
}

// --- 3. Two identical copies that differ only in spelling do not churn ---------------
{
  const local = coerceEntry(entry('m', { updatedAt: '2026-10-01T16:00:00.000Z' }));
  const remote = coerceEntry(entry('m', { updatedAt: '2026-10-01T16:00:00+00:00' }));
  const result = mergeEntries([local], [remote], () => '2026-10-02T00:00:00.000Z');
  check('same instant, different spelling is not marked changed', result.changed === false, String(result.changed));
  check('no tie is bumped for a spelling-only difference', Object.keys(result.bumped).length === 0, JSON.stringify(result.bumped));
  check('nothing is queued for upload', result.toPush.length === 0, result.toPush.join(','));
}

// --- 4. A guarded edit is accepted when the stored stamp differs only in spelling ----
{
  clearStorage();
  const stamp = '2026-10-01T16:00:00.000Z';
  seedRaw([
    entry('edit', {
      date: '2026-10-01T16:00:00+00:00',
      createdAt: '2026-10-01T16:00:00+00:00',
      updatedAt: '2026-10-01T16:00:00+00:00',
    }),
  ]);
  const updated = entryWrite.updateEntry('edit', { title: 'accepted' }, stamp);
  check(
    'an edit whose expected stamp matches the instant is accepted, not dropped',
    updated !== null && updated.title === 'accepted',
    JSON.stringify(updated && updated.title),
  );
}

// --- 5. Idle passes against a server echoing `+00:00` never re-push ------------------
{
  clearStorage();
  const base = { date: '2026-10-01T16:00:00.000Z', createdAt: '2026-10-01T16:00:00.000Z' };
  seedRaw([entry('churn', { ...base, updatedAt: '2026-10-01T16:00:00.000Z' })]);

  // The server holds the same entry and echoes every stamp back in its own spelling, the
  // way PostgREST does. The pull coerces at the boundary exactly as the real adapter does.
  const server = new Map([['churn', entry('churn', { ...base, updatedAt: '2026-10-01T16:00:00.000Z' })]]);
  const pulled = () =>
    [...server.values()].map((item) =>
      coerceEntry({
        ...item,
        date: serverSpelling(item.date),
        createdAt: serverSpelling(item.createdAt),
        updatedAt: serverSpelling(item.updatedAt),
        deletedAt: item.deletedAt ? serverSpelling(item.deletedAt) : undefined,
      }),
    );
  const adapter = stubAdapter({
    pull: async () => ({ entries: pulled(), serverTime: '' }),
    push: async (_account, list) => {
      list.forEach((item) => server.set(item.id, item));
      return list.map((item) => item.id);
    },
  });

  const perPass = [];
  for (let pass = 0; pass < 3; pass += 1) {
    const result = await syncNow(adapter, account);
    perPass.push(result.pushed);
  }
  check(
    'three idle passes push nothing when the stamp differs only in spelling',
    perPass.every((pushed) => pushed === 0),
    `pushed per pass: ${perPass.join(',')}`,
  );
  check('the outbox stays empty across the idle passes', Object.keys(readOutbox()).length === 0, JSON.stringify(readOutbox()));
  check('the entry is unchanged locally', listAllRecords()[0].updatedAt === '2026-10-01T16:00:00.000Z', listAllRecords()[0].updatedAt);
}

process.exit(report() === 0 ? 0 : 1);
