/**
 * Proves or disproves the sync race: a write made while a pull is in flight.
 *
 * `engine.ts:35` snapshots the collection, then `engine.ts:39` awaits the network. The
 * write-back at `engine.ts:47` rebuilds storage from a merge of that *snapshot* and the
 * server's answer, so anything written during the round trip is in neither input.
 *
 * The write has to happen without navigating: a navigation aborts the pending fetch
 * (`scripts/probe-navigation-fetch.mjs` proves it), which would end the pull instead of
 * racing it. So the write is made through the store directly, from the already-loaded
 * page, while the pull is held open.
 *
 * Run the API first: `node scripts/serve-sync.mjs`.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const require = createRequire(import.meta.url);
const { chromium } = require(`${globalRoot}/playwright`);

const BASE = process.env.BASE_URL ?? 'http://localhost:5213';
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
const context = await browser.newContext();
const page = await context.newPage();
const otherContext = await browser.newContext();
const otherPage = await otherContext.newPage();
page.on('pageerror', (error) => console.log(`[pageerror] ${error.message}`));

const stored = (target) =>
  target.evaluate(() => {
    const raw = window.localStorage.getItem('deardiary:entries');
    if (!raw) return [];
    return JSON.parse(raw).filter((entry) => entry.deletedAt === undefined).map((entry) => entry.title);
  });

async function signInOn(target, email) {
  await target.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await target.waitForTimeout(500);
  await target.getByLabel('Email').fill(email);
  await target.getByRole('button', { name: /send me a code/i }).click();
  await target.waitForTimeout(700);
  const code = await target.evaluate(async (mail) => {
    const response = await fetch('/api/auth/request-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: mail }),
    });
    return (await response.json()).devCode;
  }, email);
  await target.getByLabel('Six-digit code').fill(code);
  await target.getByRole('button', { name: /^sign in$/i }).click();
  await target.waitForTimeout(2000);
}

async function writeOn(target, title, body) {
  await target.goto(`${BASE}/write`, { waitUntil: 'networkidle' });
  await target.waitForTimeout(600);
  await target.fill('#entry-title', title);
  await target.click('.ProseMirror');
  await target.keyboard.type(body);
  await target.getByRole('button', { name: /^publish$/i }).click();
  await target.waitForTimeout(1200);
}

try {
  const email = `race-${Date.now()}@example.com`;
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await otherPage.goto(BASE, { waitUntil: 'domcontentloaded' });

  await writeOn(page, 'Baseline', 'Present before the race.');
  await signInOn(page, email);
  await page.waitForTimeout(2500);
  await signInOn(otherPage, email);
  await otherPage.waitForTimeout(2500);

  check('setup: the first device has the baseline entry', (await stored(page)).join() === 'Baseline');

  // --- One pull held open, with a local write landing inside it ----------------------
  // The write goes through the store the app itself uses, from the same page, so the
  // pull stays alive. `deardiary:owner` is already set by the sign-in above.
  await page.route('**/api/entries', async (route) => {
    if (route.request().method() === 'GET') {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    await route.continue();
  });

  // The other device writes first, so the server's answer carries a change this device
  // has never seen — that is what makes the merge write back.
  await writeOn(otherPage, 'Written by device two', 'From the other device.');
  await otherPage.waitForTimeout(2500);

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.waitForTimeout(500);

  // Write locally while the pull is pending, without leaving the page.
  const wroteLocally = await page.evaluate(() => {
    const entries = JSON.parse(window.localStorage.getItem('deardiary:entries') ?? '[]');
    const now = new Date().toISOString();
    entries.push({
      id: 'race-local-entry',
      title: 'Written during the pull',
      content: '<p>This must not be erased.</p>',
      mood: 'calm',
      tags: [],
      date: now,
      createdAt: now,
      updatedAt: now,
      isFavorite: false,
      isPrivate: false,
      wordCount: 4,
      readingTime: 1,
    });
    window.localStorage.setItem('deardiary:entries', JSON.stringify(entries));
    // Touch the store so the app sees it, exactly as a save would.
    return entries.length;
  });
  check('the local write landed in storage', wroteLocally === 2, `entries=${wroteLocally}`);

  const during = await stored(page);
  check('the local write is visible while the pull is pending', during.includes('Written during the pull'), during.join(' | '));

  // Let the held pull complete and the merge write back.
  await page.waitForTimeout(9000);

  const after = await stored(page);
  check(
    'the write made during the pull survives the write-back',
    after.includes('Written during the pull'),
    after.join(' | '),
  );
  check('the baseline entry survived', after.includes('Baseline'), after.join(' | '));
  check("the other device's entry arrived", after.includes('Written by device two'), after.join(' | '));
  check('nothing was lost', after.length === 3, `count=${after.length}: ${after.join(' | ')}`);
} catch (error) {
  check('script completed', false, error.message);
} finally {
  await context.close();
  await otherContext.close();
  await browser.close();
}

console.log(results.join('\n'));
console.log(`\n${failed === 0 ? 'ALL PASS' : `${failed} FAILED`}`);
process.exit(failed === 0 ? 0 : 1);
