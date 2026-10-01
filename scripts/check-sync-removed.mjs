/**
 * Config-off guarantees for the re-enabled, local-first sync.
 *
 * The sync feature is opt-in: it is off unless `VITE_SUPABASE_URL` and
 * `VITE_SUPABASE_ANON_KEY` are both set. This build has neither, so the Account section
 * must not render, no request may leave for a Supabase origin, and the diary must stay
 * fully usable. The tombstones the re-enabled write path keeps must also survive, because
 * the reverted model dropped them and this is the check that they no longer are.
 *
 * The pure suites (`check-sync-merge|race|storage.mjs`) cover the merge, the races and the
 * storage rules; this one covers what only a browser can: the built bundle with no env,
 * the real UI, and the absence of any network call.
 *
 * Run the CSP server first: `node scripts/serve-with-csp.mjs`.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const require = createRequire(import.meta.url);
const { chromium } = require(`${globalRoot}/playwright`);

const BASE = process.env.BASE_URL ?? 'http://localhost:5212';
// This suite clears localStorage. Refuse to run against anything but a local origin, so a
// stray BASE_URL can never wipe a real deployment's storage.
if (!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/.test(BASE)) {
  console.error(`Refusing to run: ${BASE} is not a local origin, and this script clears storage.`);
  process.exit(1);
}

const results = [];
let failed = 0;
function check(name, pass, detail) {
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!pass) failed += 1;
}

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

/** Every request the page makes, so a stray Supabase call is caught rather than assumed. */
const requests = [];
page.on('request', (request) => requests.push(request.url()));

const entry = (id, overrides = {}) => {
  const now = new Date().toISOString();
  return {
    id,
    title: `title-${id}`,
    content: `<p>body-${id}</p>`,
    mood: 'calm',
    tags: [],
    date: now,
    createdAt: now,
    updatedAt: now,
    isFavorite: false,
    isPrivate: false,
    wordCount: 1,
    readingTime: 1,
    ...overrides,
  };
};

/** Seeds storage directly, including tombstones. */
async function seed(records) {
  await page.evaluate((list) => {
    window.localStorage.clear();
    window.localStorage.setItem('deardiary:entries', JSON.stringify(list));
  }, records);
}

/** Every stored record, tombstones included. */
const storedRaw = () =>
  page.evaluate(() => {
    const raw = window.localStorage.getItem('deardiary:entries');
    return raw ? JSON.parse(raw) : [];
  });

/** The visible entries: stored records without a tombstone. */
const storedLive = async () => (await storedRaw()).filter((item) => item.deletedAt === undefined);

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });

  // --- 1. A legacy tombstone is preserved, not dropped -------------------------------
  // The reverted build deleted a tombstone on read. The re-enabled model keeps it: a
  // deletion has to stay a record so it can travel to another device. The tombstone must
  // still be hidden from the reader.
  await seed([
    entry('live-1'),
    entry('deleted-1', { deletedAt: '2026-09-01T00:00:00.000Z', title: 'should stay gone' }),
    entry('live-2'),
  ]);
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const afterRead = await storedRaw();
  check(
    'a tombstone is preserved in storage, not dropped',
    afterRead.some((item) => item.id === 'deleted-1' && typeof item.deletedAt === 'string'),
    afterRead.map((item) => item.id + (item.deletedAt ? '(tomb)' : '')).join(', '),
  );
  check(
    'the tombstone is not shown as a visible entry',
    !(await page.evaluate(() => document.body.textContent ?? '')).includes('should stay gone'),
  );
  check('the live entries are untouched', (await storedLive()).length === 2, `live=${(await storedLive()).length}`);

  // --- 2. Deleting leaves a tombstone, and the tombstone survives unrelated work ----
  await seed([entry('gone-1'), entry('kept-1')]);
  await page.goto(`${BASE}/entry/gone-1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /delete entry/i }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /^delete entry$/i }).last().click();
  await page.waitForTimeout(1200);

  const afterDelete = await storedRaw();
  const tomb = afterDelete.find((item) => item.id === 'gone-1');
  check(
    'a deleted entry is kept as a tombstone',
    tomb !== undefined && typeof tomb.deletedAt === 'string',
    afterDelete.map((item) => item.id + (item.deletedAt ? '(tomb)' : '')).join(', '),
  );
  check('the deleted entry is gone from the visible list', (await storedLive()).length === 1);

  // An unrelated write must not resurrect or drop the tombstone.
  await page.goto(`${BASE}/write`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.fill('#entry-title', 'Unrelated later note');
  await page.click('.ProseMirror');
  await page.keyboard.type('Written after the delete.');
  await page.getByRole('button', { name: /^publish$/i }).click();
  await page.waitForTimeout(1200);

  const afterWrite = await storedRaw();
  check(
    'the tombstone survives an unrelated write',
    afterWrite.some((item) => item.id === 'gone-1' && typeof item.deletedAt === 'string'),
    afterWrite.map((item) => item.id + (item.deletedAt ? '(tomb)' : '')).join(', '),
  );
  check('the unrelated write is stored', (await storedLive()).some((item) => item.title === 'Unrelated later note'));

  // --- 3. Clear all writes tombstones rather than an empty array ---------------------
  await seed([entry('a'), entry('b')]);
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /clear all entries/i }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /delete everything/i }).click();
  await page.waitForTimeout(1000);

  const cleared = await storedRaw();
  check(
    'clear all writes tombstones for every entry',
    cleared.length === 2 && cleared.every((item) => typeof item.deletedAt === 'string'),
    cleared.map((item) => item.id + (item.deletedAt ? '(tomb)' : '')).join(', '),
  );
  check('clear all leaves nothing visible', (await storedLive()).length === 0);

  // --- 4. The feature is hidden when the env is absent ------------------------------
  const settings = await page.evaluate(() => ({
    nav: Array.from(document.querySelectorAll('nav a')).map((a) => a.textContent.trim()),
    hasEmail: document.querySelector('input[type="email"]') !== null,
    hasSyncHeading: document.querySelector('#sync-heading') !== null,
    hasSyncLink: Array.from(document.querySelectorAll('a')).some((a) => a.getAttribute('href') === '#sync-heading'),
  }));
  check('no Account entry in the settings nav', !settings.nav.includes('Account'), settings.nav.join(', '));
  check('no sign-in form rendered', !settings.hasEmail && !settings.hasSyncHeading);
  check('no link points at the sync section', !settings.hasSyncLink);

  // --- 5. The privacy copy is the honest local-only line ----------------------------
  const privacy = await page.evaluate(() =>
    Array.from(document.querySelectorAll('p'))
      .map((p) => p.textContent.trim())
      .find((text) => /leave this browser/i.test(text)) ?? '',
  );
  check(
    'the privacy copy is the unconditional local-only line',
    privacy === 'Entries never leave this browser unless you export them yourself.',
    privacy,
  );

  // --- 6. Nothing was sent to a Supabase origin, on any route -----------------------
  const foreign = requests.filter((url) => /supabase\.co|supabase\.in|\.supabase\./.test(url));
  check('no request left for a Supabase origin', foreign.length === 0, foreign.slice(0, 3).join(' | ') || 'none');
  const offOrigin = requests.filter((url) => !url.startsWith(BASE) && !/^(data|blob):/.test(url));
  check(
    'no request left the app origin except images',
    offOrigin.every((url) => /dicebear|\.svg|\.png|\.woff2/.test(url)),
    offOrigin.slice(0, 3).join(' | ') || 'none',
  );

  // --- 6b. Per-route config-off guarantee -------------------------------------------
  // The global check above is a whole-run summary; this one proves each entry route on its
  // own. A route that lazily reached the sync code would load the Supabase chunk even though
  // no request left for the project origin, so the chunk body is inspected, not just the URL.
  // DiceBear avatars are a first-party feature and are the only permitted off-origin call.
  const SUPABASE_MARKER = /@supabase\/supabase-js|GoTrueClient/;
  const chunkText = async (url) => {
    try {
      return await (await fetch(url)).text();
    } catch {
      return '';
    }
  };
  for (const route of ['/', '/dashboard', '/settings', '/stats']) {
    const before = requests.length;
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    const made = requests.slice(before);

    const sent = made.filter((url) => /supabase\.(co|in)/.test(url));
    check(`${route}: no request left for a Supabase origin`, sent.length === 0, sent.slice(0, 3).join(' | ') || 'none');

    const chunks = made.filter((url) => url.startsWith(BASE) && url.endsWith('.js'));
    const leaked = [];
    for (const url of chunks) {
      if (SUPABASE_MARKER.test(await chunkText(url))) leaked.push(url.split('/').pop());
    }
    check(`${route}: no Supabase chunk downloaded`, leaked.length === 0, leaked.join(', ') || 'none');

    const off = made.filter((url) => !url.startsWith(BASE) && !/^(data|blob):/.test(url));
    check(
      `${route}: only images leave the app origin (DiceBear permitted)`,
      off.every((url) => /dicebear|\.svg|\.png|\.woff2/.test(url)),
      off.slice(0, 3).join(' | ') || 'none',
    );
  }

  // --- 7. The diary still works end to end ------------------------------------------
  await seed([entry('solo-1')]);
  await page.goto(`${BASE}/entry/solo-1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const readerOk = await page.evaluate(() => document.querySelector('.entry-body') !== null);
  check('the reader still renders after the re-enable', readerOk);

  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (error) {
  check('script completed', false, error.message);
} finally {
  await browser.close();
}

console.log(results.join('\n'));
console.log(`\n${failed === 0 ? 'ALL PASS' : `${failed} FAILED`}`);
process.exit(failed === 0 ? 0 : 1);
