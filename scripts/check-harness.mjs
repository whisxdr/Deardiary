/**
 * Shared test support for the pure-Node check suites.
 *
 * Provides the loader that lets a plain-Node script import the app's real `src/`
 * TypeScript modules (Vite's `@/` alias, `dompurify` stubbed because these suites are
 * not about sanitizing), a fake `window.localStorage` installed before any `src/`
 * module loads (`src/lib/storage.ts` probes storage once at module load), a
 * `{ check, report }` reporter matching the other `check-*.mjs` scripts, and a valid
 * entry fixture.
 *
 * Run for a self-check: `node scripts/check-harness.mjs`.
 */
import { register } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC_URL = pathToFileURL(join(ROOT, 'src')).href;

// DOMPurify needs a DOM. The suites that use this harness are about parsing and export,
// not sanitizing, so a pass-through stub stands in for it. The real sanitizer is
// exercised by `check-features.mjs`.
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

/** A valid entry record with a fixed base date, for export and parse fixtures. */
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

// --- Self-check when run directly -------------------------------------------------
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const r = reporter('harness self-check');
  const parse = await loadSrc('lib/parse.ts');
  r.check('loader resolves src modules', typeof parse?.htmlToText === 'function');
  r.check('fixture is a valid entry shape', entry('a').title === 'title-a');
  process.exit(r.report() === 0 ? 0 : 1);
}
