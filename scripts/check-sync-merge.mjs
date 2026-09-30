import { mergeEntries } from '../src/services/sync/merge.ts';

/**
 * Merge rules for cloud sync.
 *
 * The merge decides whether a user's writing survives, so every branch is checked
 * directly rather than only through the browser. Run: `node scripts/check-sync-merge.mjs`
 */

let failures = 0;
function check(name, pass, detail) {
  if (!pass) failures += 1;
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const entry = (id, overrides = {}) => ({
  id,
  title: `title-${id}`,
  content: `<p>body-${id}</p>`,
  mood: 'calm',
  tags: [],
  date: '2026-09-01T10:00:00.000Z',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  isFavorite: false,
  isPrivate: false,
  wordCount: 1,
  readingTime: 1,
  ...overrides,
});

// --- A local-only entry is kept and uploaded -----------------------------------------
{
  const result = mergeEntries([entry('a')], []);
  check('local-only entry survives', result.merged.length === 1 && result.merged[0].id === 'a');
  check('local-only entry is queued for upload', result.toPush.includes('a'));
}

// --- A remote-only entry is downloaded ----------------------------------------------
{
  const result = mergeEntries([], [entry('b')]);
  check('remote-only entry is downloaded', result.merged.length === 1 && result.merged[0].id === 'b');
  check('remote-only entry is not re-uploaded', !result.toPush.includes('b'));
  check('downloading marks the collection changed', result.changed);
}

// --- The later stamp wins, in both directions ---------------------------------------
{
  const localNewer = mergeEntries([entry('c', { updatedAt: '2026-09-02T00:00:00.000Z' })], [entry('c')]);
  check('newer local copy wins', localNewer.merged[0].updatedAt === '2026-09-02T00:00:00.000Z');
  check('winning local copy is pushed', localNewer.toPush.includes('c'));

  const remoteNewer = mergeEntries([entry('d')], [entry('d', { updatedAt: '2026-09-03T00:00:00.000Z' })]);
  check('newer remote copy wins', remoteNewer.merged[0].updatedAt === '2026-09-03T00:00:00.000Z');
  check('losing local copy is not pushed', !remoteNewer.toPush.includes('d'));
  check('remote win marks the collection changed', remoteNewer.changed);
}

// --- A tie keeps the local copy and does not churn ----------------------------------
{
  const result = mergeEntries([entry('e')], [entry('e')]);
  check('identical copies are not marked changed', !result.changed);
  check('identical copies are not re-uploaded', result.toPush.length === 0);
}

// --- Deletion beats an older edit, in both directions -------------------------------
{
  const deletedLocal = mergeEntries(
    [entry('f', { updatedAt: '2026-09-05T00:00:00.000Z', deletedAt: '2026-09-05T00:00:00.000Z' })],
    [entry('f', { updatedAt: '2026-09-04T00:00:00.000Z' })],
  );
  check('newer local deletion wins', deletedLocal.merged[0].deletedAt === '2026-09-05T00:00:00.000Z');
  check('deletion is pushed so the other device drops it', deletedLocal.toPush.includes('f'));

  const deletedRemote = mergeEntries(
    [entry('g', { updatedAt: '2026-09-04T00:00:00.000Z' })],
    [entry('g', { updatedAt: '2026-09-06T00:00:00.000Z', deletedAt: '2026-09-06T00:00:00.000Z' })],
  );
  check('newer remote deletion wins', deletedRemote.merged[0].deletedAt === '2026-09-06T00:00:00.000Z');
  check('remote deletion is not pushed back', !deletedRemote.toPush.includes('g'));
}

// --- An edit made after a delete resurrects the entry --------------------------------
{
  const result = mergeEntries(
    [entry('h', { updatedAt: '2026-09-07T00:00:00.000Z' })],
    [entry('h', { updatedAt: '2026-09-06T00:00:00.000Z', deletedAt: '2026-09-06T00:00:00.000Z' })],
  );
  check('an edit newer than a delete wins', result.merged[0].deletedAt === undefined);
  check('the resurrecting edit is pushed', result.toPush.includes('h'));
}

// --- Neither side is ever dropped ---------------------------------------------------
{
  const local = [entry('l1'), entry('l2'), entry('shared', { updatedAt: '2026-09-09T00:00:00.000Z' })];
  const remote = [entry('r1'), entry('shared'), entry('r2')];
  const result = mergeEntries(local, remote);
  const ids = new Set(result.merged.map((item) => item.id));
  check('union keeps every id from both sides', ids.size === 5, [...ids].join(','));
  check('every id appears exactly once', result.merged.length === 5);
}

// --- Order of sign-in does not matter ------------------------------------------------
{
  // Phone has data and signs in second; laptop signed in first with an empty diary.
  const laptopEmpty = [];
  const phoneWithData = [entry('p1'), entry('p2')];
  const laptopResult = mergeEntries(laptopEmpty, phoneWithData);
  check('first device to sign in downloads the second device\'s entries', laptopResult.merged.length === 2);
  check('first device does not delete anything', laptopResult.toPush.length === 0);
}

console.log(`\n${failures === 0 ? 'ALL PASS' : `${failures} FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
