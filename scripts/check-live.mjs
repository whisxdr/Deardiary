/**
 * Verifies the deployed bundle on the live origin.
 *
 * The live site holds the real diary, so this only touches the app's own draft key and
 * restores it byte for byte. `deardiary:entries` and `deardiary:settings` are read but
 * never written: destroying a real profile during a cleanup pass has happened once here
 * already and must not happen again.
 *
 * Run: `node scripts/check-live.mjs`
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const require = createRequire(import.meta.url);
const { chromium } = require(`${globalRoot}/playwright`);

const BASE = process.env.BASE_URL ?? 'https://dearmydiary-eight.vercel.app';
const results = [];
let failed = 0;

function check(name, pass, detail) {
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!pass) failed += 1;
}

const browser = await chromium.launch();
const page = await browser.newPage();
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

let draftBackup;
let hadDraft = false;

try {
  // --- Security headers, read-only ---
  const response = await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const headers = response.headers();
  check('CSP header present', /script-src 'self'/.test(headers['content-security-policy'] ?? ''), headers['content-security-policy']?.slice(0, 60));
  check('X-Frame-Options is DENY', headers['x-frame-options'] === 'DENY', headers['x-frame-options']);
  check('nosniff is set', headers['x-content-type-options'] === 'nosniff', headers['x-content-type-options']);
  check('no external font or script origin', !/fonts\.googleapis|fonts\.gstatic/.test(await page.content()));

  // --- Preserve the user's own draft before any test that writes one ---
  draftBackup = await page.evaluate(() => window.localStorage.getItem('deardiary:draft'));
  hadDraft = draftBackup !== null;

  // --- Every route renders without crashing ---
  const before = await page.evaluate(() => ({
    entries: window.localStorage.getItem('deardiary:entries'),
    settings: window.localStorage.getItem('deardiary:settings'),
  }));

  for (const path of ['/dashboard', '/calendar', '/stats', '/settings']) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    const text = await page.evaluate(() => document.body.textContent ?? '');
    check(`${path} renders without the crash page`, !/lost its bookmark/i.test(text), text.slice(0, 60));
  }

  // --- The reported bug: New entry must open a clean page ---
  await page.goto(`${BASE}/write`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const composer = await page.evaluate(() => ({
    title: document.querySelector('#entry-title')?.value ?? null,
    body: (document.querySelector('.ProseMirror')?.textContent ?? '').trim(),
    hasEditor: document.querySelector('.ProseMirror') !== null,
  }));
  check('New entry opens an empty title on live', composer.title === '', JSON.stringify(composer.title));
  check('New entry opens an empty body on live', composer.body === '', JSON.stringify(composer.body.slice(0, 40)));

  // --- A deep link to a missing entry must not offer a fake composer ---
  await page.goto(`${BASE}/write/does-not-exist`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const missing = await page.evaluate(() => ({
    hasEditor: document.querySelector('.ProseMirror') !== null,
    text: document.body.textContent ?? '',
  }));
  check('Missing entry shows the not-found state on live', !missing.hasEditor && /missing/i.test(missing.text), `editor=${missing.hasEditor}`);

  // --- The user's own data must be untouched ---
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const after = await page.evaluate(() => ({
    entries: window.localStorage.getItem('deardiary:entries'),
    settings: window.localStorage.getItem('deardiary:settings'),
  }));
  check('live entries untouched', before.entries === after.entries, before.entries === after.entries ? '' : 'entries changed!');
  check('live settings untouched', before.settings === after.settings, before.settings === after.settings ? '' : 'settings changed!');
} catch (error) {
  check('script completed', false, error.message);
} finally {
  // Restore the draft exactly as it was, whether or not the run finished.
  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ([value, existed]) => {
        if (existed) window.localStorage.setItem('deardiary:draft', value);
        else window.localStorage.removeItem('deardiary:draft');
      },
      [draftBackup, hadDraft],
    );
    const restored = await page.evaluate(() => window.localStorage.getItem('deardiary:draft'));
    check('user draft restored', restored === draftBackup, hadDraft ? 'draft existed before the run' : 'no draft before the run');
  } catch (error) {
    check('user draft restored', false, error.message);
  }

  const realErrors = consoleErrors.filter((text) => !/favicon|Download the React DevTools/i.test(text));
  check('no console errors on live', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));
  await browser.close();
}

console.log(results.join('\n'));
console.log(`\n${failed === 0 ? 'ALL PASS' : `${failed} FAILED`}`);
process.exit(failed === 0 ? 0 : 1);
