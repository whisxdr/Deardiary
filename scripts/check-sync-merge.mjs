/**
 * Merge rules for cloud sync, run against the real `src/services/sync/merge.ts`.
 *
 * The merge decides whether a user's writing survives, so every branch is checked directly
 * rather than only through a browser. A differential pass at the end re-runs each case
 * against an independent oracle and fails on any divergence, so the suite cannot pass
 * against a weaker merge than the code claims to be.
 *
 * Run: `node scripts/check-sync-merge.mjs`
 */
import { entry, mergeEntries, mergeDivergences, reporter } from './check-sync-harness.mjs';

const { check, report } = reporter('sync merge rules');
const cases = [];
/** Tie cases whose winner is re-stamped; run through the oracle with a fresh stamp minter. */
const bumpCases = [];
/** Runs the real merge and records the case for the differential pass. */
const run = (local, remote) => {
  cases.push([local, remote]);
  return mergeEntries(local, remote);
};

// --- A local-only entry is kept and uploaded -----------------------------------------
{
  const result = run([entry('a')], []);
  check('local-only entry survives', result.merged.length === 1 && result.merged[0].id === 'a');
  check('local-only entry is queued for upload', result.toPush.includes('a'));
}

// --- A remote-only entry is downloaded ----------------------------------------------
{
  const result = run([], [entry('b')]);
  check('remote-only entry is downloaded', result.merged.length === 1 && result.merged[0].id === 'b');
  check('remote-only entry is not re-uploaded', !result.toPush.includes('b'));
  check('downloading marks the collection changed', result.changed);
}

// --- The later stamp wins, in both directions ---------------------------------------
{
  const localNewer = run([entry('c', { updatedAt: '2026-09-02T00:00:00.000Z' })], [entry('c')]);
  check('newer local copy wins', localNewer.merged[0].updatedAt === '2026-09-02T00:00:00.000Z');
  check('winning local copy is pushed', localNewer.toPush.includes('c'));

  const remoteNewer = run([entry('d')], [entry('d', { updatedAt: '2026-09-03T00:00:00.000Z' })]);
  check('newer remote copy wins', remoteNewer.merged[0].updatedAt === '2026-09-03T00:00:00.000Z');
  check('losing local copy is not pushed', !remoteNewer.toPush.includes('d'));
  check('remote win marks the collection changed', remoteNewer.changed);
}

// --- A tie keeps the local copy and does not churn ----------------------------------
{
  const result = run([entry('e')], [entry('e')]);
  check('identical copies are not marked changed', !result.changed);
  check('identical copies are not re-uploaded', result.toPush.length === 0);
}

// --- Deletion beats an older edit, in both directions -------------------------------
{
  const deletedLocal = run(
    [entry('f', { updatedAt: '2026-09-05T00:00:00.000Z', deletedAt: '2026-09-05T00:00:00.000Z' })],
    [entry('f', { updatedAt: '2026-09-04T00:00:00.000Z' })],
  );
  check('newer local deletion wins', deletedLocal.merged[0].deletedAt === '2026-09-05T00:00:00.000Z');
  check('deletion is pushed so the other device drops it', deletedLocal.toPush.includes('f'));

  const deletedRemote = run(
    [entry('g', { updatedAt: '2026-09-04T00:00:00.000Z' })],
    [entry('g', { updatedAt: '2026-09-06T00:00:00.000Z', deletedAt: '2026-09-06T00:00:00.000Z' })],
  );
  check('newer remote deletion wins', deletedRemote.merged[0].deletedAt === '2026-09-06T00:00:00.000Z');
  check('remote deletion is not pushed back', !deletedRemote.toPush.includes('g'));
}

// --- A tombstone on one side removes the entry on the other -------------------------
{
  const result = run(
    [entry('t1'), entry('live')],
    [entry('t1', { updatedAt: '2026-09-08T00:00:00.000Z', deletedAt: '2026-09-08T00:00:00.000Z' })],
  );
  const kept = result.merged.find((item) => item.id === 't1');
  check('a remote tombstone is adopted locally', kept?.deletedAt === '2026-09-08T00:00:00.000Z');
  check('the union still holds the untouched entry', result.merged.some((item) => item.id === 'live'));
}

// --- An edit made after a delete resurrects the entry --------------------------------
{
  const result = run(
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
  const result = run(local, remote);
  const ids = new Set(result.merged.map((item) => item.id));
  check('union keeps every id from both sides', ids.size === 5, [...ids].join(','));
  check('every id appears exactly once', result.merged.length === 5);
}

// --- Order of sign-in does not matter ------------------------------------------------
{
  // Phone has data and signs in second; laptop signed in first with an empty diary.
  const laptopResult = run([], [entry('p1'), entry('p2')]);
  check("first device to sign in downloads the second device's entries", laptopResult.merged.length === 2);
  check('first device does not delete anything', laptopResult.toPush.length === 0);
}

// --- An exact tie converges deterministically --------------------------------------
{
  // Two devices can stamp the same millisecond. Both sides must pick the same winner from
  // the same inputs, or each keeps its own copy, both re-push, and the server rejects both.
  const left = entry('tie', { content: '<p>AAA</p>', updatedAt: '2026-09-10T00:00:00.000Z' });
  const right = entry('tie', { content: '<p>ZZZ</p>', updatedAt: '2026-09-10T00:00:00.000Z' });

  const fromLeft = run([left], [right]);
  const fromRight = run([right], [left]);
  check(
    'an exact tie picks the same winner on both devices',
    fromLeft.merged[0].content === fromRight.merged[0].content,
    `${fromLeft.merged[0].content} vs ${fromRight.merged[0].content}`,
  );
  check('the tie winner is not left undecided', fromLeft.merged.length === 1);
  // The loser must push, or the winner never reaches the device that lost the tie.
  check('the losing side queues a push', fromLeft.toPush.length + fromRight.toPush.length >= 1);
}

// --- A tie with equal content but a different title still converges ------------------
{
  const left = entry('tie2', { title: 'Alpha', updatedAt: '2026-09-11T00:00:00.000Z' });
  const right = entry('tie2', { title: 'Beta', updatedAt: '2026-09-11T00:00:00.000Z' });
  const fromLeft = run([left], [right]);
  const fromRight = run([right], [left]);
  check('a title-only tie converges', fromLeft.merged[0].title === fromRight.merged[0].title);
}

// --- A field-only difference is still a difference ---------------------------------
{
  // `updatedAt` matches but the mood does not. With only the body compared, the merge saw
  // no difference, pushed nothing, and the server kept the other mood forever.
  const result = run([entry('field', { mood: 'happy' })], [entry('field', { mood: 'sad' })]);
  check(
    'a differing mood on an equal stamp still triggers a push or a write',
    result.changed || result.toPush.length > 0,
    `changed=${result.changed} toPush=${result.toPush.length}`,
  );
}

// --- A field-only tie converges through the real merge and re-stamps the winner -----
{
  // A tie on `updatedAt` with a differing field is not resolved by "local wins": both
  // devices must pick the same winner AND the winner must carry a stamp strictly past the
  // shared one, or its push would be rejected by the server's `updated_at <` guard and the
  // two devices would disagree forever. The winner is the higher canonical key: `sad` > `happy`.
  const shared = '2026-09-19T00:00:00.000Z';
  const left = entry('tie-field', { mood: 'happy', updatedAt: shared });
  const right = entry('tie-field', { mood: 'sad', updatedAt: shared });

  const fromHappy = mergeEntries([left], [right], () => '2026-09-20T00:00:00.000Z');
  const fromSad = mergeEntries([right], [left], () => '2026-09-20T00:00:00.000Z');
  check(
    'a field-only tie picks the same mood on both devices',
    fromHappy.merged[0].mood === fromSad.merged[0].mood && fromHappy.merged[0].mood === 'sad',
    `${fromHappy.merged[0].mood} vs ${fromSad.merged[0].mood}`,
  );
  // The device that holds the winner must re-stamp it past the shared stamp so its push wins.
  check(
    'the tie winner is re-stamped strictly past the shared stamp',
    new Date(fromSad.merged[0].updatedAt).getTime() > new Date(shared).getTime(),
    fromSad.merged[0].updatedAt,
  );
  check('the bumped winner is queued for upload', fromSad.toPush.includes('tie-field'));
  check('the bump is reported for the outbox', fromSad.bumped['tie-field'] === fromSad.merged[0].updatedAt);
  check('the settle stamp is the bumped one', fromSad.settled['tie-field'] === fromSad.merged[0].updatedAt);
  // The device that lost the tie adopts the winner unchanged and settles its own old stamp.
  check('the losing device does not bump', fromHappy.bumped['tie-field'] === undefined);
  check('the losing device settles the stamp it considered', fromHappy.settled['tie-field'] === shared);
  bumpCases.push([[left], [right]]);
}

// --- A remote-won tie settles the local stamp so the loser clears cleanly -----------
{
  const left = entry('lose', { content: '<p>aaa</p>', updatedAt: '2026-09-21T00:00:00.000Z' });
  const right = entry('lose', { content: '<p>zzz</p>', updatedAt: '2026-09-21T00:00:00.000Z' });
  const result = mergeEntries([left], [right]);
  check('the remote copy wins the tie', result.merged[0].content === '<p>zzz</p>', result.merged[0].content);
  check(
    'the settle stamp is the local stamp that was considered',
    result.settled.lose === left.updatedAt,
    result.settled.lose,
  );
  check('a remote win is not queued for upload', !result.toPush.includes('lose'));
}

// --- Every field is part of the comparison ------------------------------------------
{
  const fields = [
    ['tags', { tags: ['a'] }, { tags: ['b'] }],
    ['isFavorite', { isFavorite: true }, { isFavorite: false }],
    ['isPrivate', { isPrivate: true }, { isPrivate: false }],
    ['location', { location: 'here' }, { location: 'there' }],
    ['images', { images: ['a.png'] }, { images: ['b.png'] }],
    ['date', { date: '2026-01-01T00:00:00.000Z' }, { date: '2026-02-02T00:00:00.000Z' }],
    ['title', { title: 'one' }, { title: 'two' }],
  ];
  const missed = fields.filter(([, leftPatch, rightPatch]) => {
    const result = run([entry('f', leftPatch)], [entry('f', rightPatch)]);
    return !result.changed && result.toPush.length === 0;
  });
  check(
    'no field difference is silently ignored',
    missed.length === 0,
    missed.map(([name]) => name).join(', ') || 'all covered',
  );
}

// --- A tombstone difference alone is a difference -----------------------------------
{
  const result = run(
    [entry('del', { updatedAt: '2026-09-12T00:00:00.000Z' })],
    [entry('del', { updatedAt: '2026-09-12T00:00:00.000Z', deletedAt: '2026-09-12T00:00:00.000Z' })],
  );
  check(
    'a deletedAt-only difference on an equal stamp is not ignored',
    result.changed || result.toPush.length > 0,
    `changed=${result.changed} toPush=${result.toPush.length}`,
  );
}

// --- The real merge agrees with the independent oracle on every case -----------------
{
  const divergences = mergeDivergences(cases);
  check(
    'the real merge matches the oracle on every case above',
    divergences.length === 0,
    divergences.slice(0, 3).join(' | ') || `${cases.length} cases agree`,
  );

  // The bump path needs the same stamp on both sides to stay comparable, so each side gets
  // its own fresh sequence from the factory.
  const bumped = mergeDivergences(bumpCases, () => {
    let n = 0;
    return () => `2026-09-30T00:00:00.00${++n}Z`;
  });
  check(
    'the real merge matches the oracle on the re-stamped tie cases',
    bumped.length === 0,
    bumped.slice(0, 3).join(' | ') || `${bumpCases.length} cases agree`,
  );
}

process.exit(report() === 0 ? 0 : 1);
