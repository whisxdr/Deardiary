/**
 * Shared test support for the re-enabled, local-first sync suite.
 *
 * The model is local-first: localStorage stays authoritative, tombstones are kept so a
 * deletion can travel, and the network is optional. Three pure suites sit on top of this
 * file and a fourth (browser) suite covers the config-off guarantees:
 *
 *   check-sync-merge.mjs     merge rules: union by id, later stamp wins, deterministic ties
 *   check-sync-race.mjs      outbox compare-and-delete, and a write landing inside a pull
 *   check-sync-storage.mjs   tombstone durability, delete/clear-all tombstones, owner change
 *   check-sync-removed.mjs   config-off: feature hidden, privacy copy honest, no network and
 *                            no Supabase chunk on /, /dashboard, /settings, /stats
 *
 * The real `src/` modules are the system under test. The reference implementations below
 * are independent oracles rebuilt from the pre-revert history (`d5b3ca5`); a differential
 * check fails the run when the real module and the oracle disagree, so the suite cannot
 * pass against a weaker spec than the one the code claims.
 *
 * `import.meta.env` is a Vite-only binding, so `src/services/supabase/config.ts` cannot be
 * imported under plain Node; the env-not-configured guarantees are checked in the browser
 * suite instead.
 *
 * Run the harness alone for a self-check: `node scripts/check-sync-harness.mjs`.
 */
import { register } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC_URL = pathToFileURL(join(ROOT, 'src')).href;

// DOMPurify needs a DOM. These suites are about merge, storage and races, not sanitizing,
// so a pass-through stub stands in for it. The real sanitizer is exercised by the browser
// suite and by `check-features.mjs`.
const DOMPURIFY_STUB =
  'data:text/javascript,' +
  encodeURIComponent('const sanitize = (html) => html; export default { sanitize }; export { sanitize };');

const HOOK = `
const SRC = ${JSON.stringify(SRC_URL)};
const DOMP = ${JSON.stringify(DOMPURIFY_STUB)};
export async function resolve(spec, ctx, next) {
  if (spec === 'dompurify') return { url: DOMP, shortCircuit: true, format: 'module' };
  const attempts = [];
  if (spec.startsWith('@/')) {
    const base = SRC + '/' + spec.slice(2);
    attempts.push(base, base + '.ts', base + '.tsx', base + '/index.ts');
  } else if (spec.startsWith('.')) {
    const base = new URL(spec, ctx.parentURL).href;
    attempts.push(spec, base + '.ts', base + '.tsx', base + '/index.ts');
  } else {
    return next(spec, ctx);
  }
  let last;
  for (const a of attempts) {
    try { return await next(a, ctx); } catch (error) { last = error; }
  }
  throw last;
}
`;
register('data:text/javascript,' + encodeURIComponent(HOOK));

/**
 * Installs a fake `window.localStorage` before any `src/` module loads.
 *
 * `src/lib/storage.ts` probes storage once at module load, so this has to run first.
 * Object-backed rather than a Map so `Object.keys` (used by `estimateUsage`) sees the
 * keys. Nothing here touches a real browser origin, so there is no localhost guard to
 * make: these suites never clear a real localStorage.
 */
function installFakeStorage() {
  const data = {};
  const api = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    removeItem: (key) => {
      delete data[key];
    },
    clear: () => {
      Object.keys(data).forEach((key) => delete data[key]);
    },
    key: (index) => Object.keys(data)[index] ?? null,
    get length() {
      return Object.keys(data).length;
    },
  };
  globalThis.window = { localStorage: api };
  globalThis.localStorage = api;
  return api;
}
installFakeStorage();

/** Dynamically imports a module under `src/`, returning null when it does not exist. */
export async function loadSrc(rel) {
  try {
    return await import(pathToFileURL(join(ROOT, 'src', rel)).href);
  } catch {
    return null;
  }
}

/** `{ check, report }` reporter matching the other `check-*.mjs` scripts. */
export function reporter(label) {
  const results = [];
  let failed = 0;
  return {
    label,
    check(name, pass, detail) {
      results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
      if (!pass) failed += 1;
    },
    report() {
      console.log(`\n# ${label}`);
      console.log(results.join('\n'));
      console.log(`${failed === 0 ? 'ALL PASS' : `${failed} FAILED`}`);
      return failed;
    },
  };
}

/** A valid entry record with a fixed base date, for merge and storage fixtures. */
export function entry(id, overrides = {}) {
  return {
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
  };
}

// --- Real modules under test ------------------------------------------------------
const sync = await loadSrc('services/sync/index.ts');
export const mergeEntries = sync.mergeEntries;
export const syncNow = sync.syncNow;
export const readOutbox = sync.readOutbox;
export const writeOutbox = sync.writeOutbox;
export const enqueue = sync.enqueue;
export const clearUploaded = sync.clearUploaded;
export const outboxSignature = sync.outboxSignature;
export const pendingCount = sync.pendingCount;
export const nextStamp = sync.nextStamp;
export const observeStamps = sync.observeStamps;
export const readOwner = sync.readOwner;
export const isForeignAccount = sync.isForeignAccount;
export const claimDevice = sync.claimDevice;
export const clearLocalEntries = sync.clearLocalEntries;
export const hasPendingUpload = sync.hasPendingUpload;

export const entryQuery = await loadSrc('services/entryQuery.ts');
export const entryWrite = await loadSrc('services/entryWrite.ts');
const { STORAGE_KEYS } = await loadSrc('constants/storageKeys.ts');
export const STORAGE_KEY = STORAGE_KEYS;

/** Convenience re-exports of the real read path, so suites import one module. */
export const listAllRecords = entryQuery.listAllRecords;
export const listEntries = entryQuery.listEntries;
export const saveEntries = entryQuery.saveEntries;
export const findEntry = entryQuery.findEntry;

/** Raw stored records, tombstones included. */
export function rawEntries() {
  const raw = globalThis.localStorage.getItem(STORAGE_KEYS.entries);
  return raw ? JSON.parse(raw) : [];
}

/** Seeds storage directly with a raw list, bypassing any repair. */
export function seedRaw(list) {
  globalThis.localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(list));
}

/** Clears every key this app writes. */
export function clearStorage() {
  globalThis.localStorage.clear();
}

// --- Reference oracles (rebuilt from d5b3ca5) -------------------------------------

/** Every user-visible field as one comparable string; the whole record, not just the body. */
export function entryKey(entry) {
  return [
    entry.updatedAt,
    entry.deletedAt ?? '',
    entry.title,
    entry.content,
    entry.mood,
    entry.date,
    entry.isFavorite ? '1' : '0',
    entry.isPrivate ? '1' : '0',
    entry.location ?? '',
    entry.tags.join('\u0000'),
    (entry.images ?? []).join('\u0000'),
  ].join('\u0001');
}

/** True when two records are the same version of an entry. */
export function sameEntry(a, b) {
  return entryKey(a) === entryKey(b);
}

function preferred(local, remote) {
  const localAt = new Date(local.updatedAt).getTime();
  const remoteAt = new Date(remote.updatedAt).getTime();
  if (remoteAt !== localAt) return remoteAt > localAt ? remote : local;
  return entryKey(local) >= entryKey(remote) ? local : remote;
}

/** Independent oracle for `mergeEntries`, including the settle and bump maps. */
export function referenceMerge(local, remote, stampAfter) {
  const localById = new Map(local.map((item) => [item.id, item]));
  const remoteById = new Map(remote.map((item) => [item.id, item]));
  const ids = new Set([...localById.keys(), ...remoteById.keys()]);
  const merged = [];
  const toPush = [];
  const bumped = {};
  const settled = {};
  let changed = false;

  ids.forEach((id) => {
    const localCopy = localById.get(id);
    const remoteCopy = remoteById.get(id);
    if (localCopy && !remoteCopy) {
      merged.push(localCopy);
      toPush.push(id);
      settled[id] = localCopy.updatedAt;
      return;
    }
    if (!localCopy && remoteCopy) {
      merged.push(remoteCopy);
      settled[id] = remoteCopy.updatedAt;
      changed = true;
      return;
    }
    if (!localCopy || !remoteCopy) return;

    if (preferred(localCopy, remoteCopy) === remoteCopy) {
      merged.push(remoteCopy);
      settled[id] = localCopy.updatedAt;
      if (!sameEntry(localCopy, remoteCopy)) changed = true;
      return;
    }
    if (sameEntry(localCopy, remoteCopy)) {
      merged.push(localCopy);
      settled[id] = localCopy.updatedAt;
      return;
    }
    const tied = new Date(localCopy.updatedAt).getTime() === new Date(remoteCopy.updatedAt).getTime();
    if (tied && stampAfter) {
      const stamp = stampAfter();
      bumped[id] = stamp;
      merged.push({ ...localCopy, updatedAt: stamp });
      toPush.push(id);
      settled[id] = stamp;
      changed = true;
      return;
    }
    merged.push(localCopy);
    toPush.push(id);
    settled[id] = localCopy.updatedAt;
  });

  return { merged, toPush, changed, bumped, settled };
}

/**
 * Fails on any case where the real merge disagrees with the oracle.
 *
 * Keeps the suite honest: the oracle is only a stand-in, and a real module that drifts
 * from it must turn the run red instead of quietly satisfying a weaker spec. When a
 * `stampAfterFactory` is given, each side gets a fresh minter so both consume the same
 * sequence of stamps and the bumped results stay comparable.
 */
export function mergeDivergences(cases, stampAfterFactory) {
  return cases
    .map(([local, remote]) => {
      const a = referenceMerge(local, remote, stampAfterFactory ? stampAfterFactory() : undefined);
      const b = mergeEntries(local, remote, stampAfterFactory ? stampAfterFactory() : undefined);
      return JSON.stringify(a) === JSON.stringify(b)
        ? null
        : `local=[${local.map((e) => e.id)}] remote=[${remote.map((e) => e.id)}]`;
    })
    .filter(Boolean);
}

/** A `RemoteAdapter` stub: no network, responses scripted by the caller. */
export function stubAdapter({ pull, push } = {}) {
  return {
    requestCode: async () => {},
    verifyCode: async () => null,
    resume: async () => null,
    signOut: async () => {},
    pull: pull ?? (async () => ({ entries: [], serverTime: '' })),
    push: push ?? (async () => {}),
  };
}

/** A deferred promise, so a test can hold a pull open and resume it on demand. */
export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// --- Self-check when run directly -------------------------------------------------
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = reporter('sync harness self-check');
  r.check('sync barrel loaded', Boolean(mergeEntries && syncNow && readOutbox));
  r.check('entry query loaded', Boolean(entryQuery?.listAllRecords));
  r.check('entry write loaded', Boolean(entryWrite?.deleteEntry));
  r.check(
    'oracle agrees with the real merge on a two-sided case',
    mergeDivergences([[[entry('a')], [entry('b')]]]).length === 0,
  );
  process.exit(r.report() === 0 ? 0 : 1);
}
