/**
 * Checks that the sync removal left no trace and no data hazard.
 *
 * The sync feature stored deletions as tombstones (`deletedAt`) so they could travel
 * between devices. With sync gone there is nothing to tell, so a leftover tombstone has to
 * be dropped — otherwise a deleted entry sits in storage forever, and any code that reads
 * the raw array would still count it.
 *
 * Run with the CSP server up: `node scripts/serve-with-csp.mjs`.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const require = createRequire(import.meta.url);
const { chromium } = require(`${globalRoot}/playwright`);

const BASE = process.env.BASE_URL ?? 'http://localhost:5212';
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
await page.goto(BASE, { waitUntil: 'domcontentloaded' });

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

/** Seeds storage directly, including a legacy tombstone. */
async function seed(records) {
  await page.evaluate((list) => {
    window.localStorage.clear();
    window.localStorage.setItem('deardiary:entries', JSON.stringify(list));
  }, records);
}

const stored = () =>
  page.evaluate(() => {
    const raw = window.localStorage.getItem('deardiary:entries');
    return raw ? JSON.parse(raw) : [];
  });

try {
  // --- 1. A legacy tombstone is dropped, not resurrected ----------------------------
  await seed([
    entry('live-1'),
    entry('deleted-1', { deletedAt: '2026-09-01T00:00:00.000Z', title: 'should stay gone' }),
    entry('live-2'),
  ]);
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const afterRead = await stored();
  check(
    'a legacy tombstone is removed from storage',
    !afterRead.some((item) => item.id === 'deleted-1'),
    afterRead.map((item) => item.id).join(', '),
  );
  check(
    'the tombstone is not resurrected as a visible entry',
    !(await page.evaluate(() => document.body.textContent ?? '')).includes('should stay gone'),
  );
  check('live entries survive the cleanup', afterRead.length === 2, `count=${afterRead.length}`);

  // --- 2. Deleting is permanent ------------------------------------------------------
  await seed([entry('gone-1'), entry('kept-1')]);
  await page.goto(`${BASE}/entry/gone-1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /delete entry/i }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /^delete entry$/i }).last().click();
  await page.waitForTimeout(1200);

  const afterDelete = await stored();
  check(
    'a deleted entry is removed outright, with no tombstone left',
    afterDelete.length === 1 && afterDelete[0].id === 'kept-1',
    JSON.stringify(afterDelete.map((item) => item.id)),
  );
  check(
    'the deleted record carries no deletedAt stamp',
    afterDelete.every((item) => item.deletedAt === undefined),
  );

  // --- 3. No sync leftovers in storage ----------------------------------------------
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const keys = await page.evaluate(() =>
    Object.keys(window.localStorage).filter((key) => key.startsWith('deardiary')),
  );
  const syncKeys = keys.filter((key) => /outbox|owner|session|synced/.test(key));
  check('no sync storage keys remain', syncKeys.length === 0, syncKeys.join(', ') || 'none');

  // --- 4. No Account section, and the privacy claim is honest -----------------------
  const settings = await page.evaluate(() => ({
    nav: Array.from(document.querySelectorAll('nav a')).map((a) => a.textContent.trim()),
    hasEmail: document.querySelector('input[type="email"]') !== null,
    hasSyncHeading: document.querySelector('#sync-heading') !== null,
    privacy:
      Array.from(document.querySelectorAll('p'))
        .map((p) => p.textContent)
        .find((text) => /leave this browser/i.test(text)) ?? '',
  }));
  check('no Account entry in the settings nav', !settings.nav.includes('Account'), settings.nav.join(', '));
  check('no sign-in form rendered', !settings.hasEmail && !settings.hasSyncHeading);
  check(
    'the privacy copy is unconditional again',
    settings.privacy === 'Entries never leave this browser unless you export them yourself.',
    settings.privacy,
  );

  // --- 5. Clear all entries leaves nothing behind -----------------------------------
  await seed([entry('a'), entry('b')]);
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.getByRole('button', { name: /clear all entries/i }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /delete everything/i }).click();
  await page.waitForTimeout(1000);

  const cleared = await stored();
  check('clear all entries writes an empty collection', cleared.length === 0, `count=${cleared.length}`);

  // --- 6. The app still works end to end --------------------------------------------
  await page.goto(`${BASE}/write`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.fill('#entry-title', 'After the removal');
  await page.click('.ProseMirror');
  await page.keyboard.type('Still writing.');
  await page.getByRole('button', { name: /^publish$/i }).click();
  await page.waitForTimeout(1200);
  const published = await stored();
  check(
    'writing still works after the removal',
    published.length === 1 && published[0].title === 'After the removal',
    JSON.stringify(published.map((item) => item.title)),
  );

  check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (error) {
  check('script completed', false, error.message);
} finally {
  await browser.close();
}

console.log(results.join('\n'));
console.log(`\n${failed === 0 ? 'ALL PASS' : `${failed} FAILED`}`);
process.exit(failed === 0 ? 0 : 1);
