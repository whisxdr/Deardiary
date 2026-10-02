/**
 * Verifies the PDF pagination fix and the Ctrl+Enter publish path.
 *
 * Both were reported broken by the audit: a long entry was silently clipped to one page
 * because `addImage` does not paginate, and Ctrl+Enter inserted a hard break before the
 * publish handler ran. This drives the real UI and measures the results — the download is
 * saved and its page objects counted, and the published body is read from the reader.
 *
 * Run with the CSP server up: `node scripts/serve-with-csp.mjs`.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

/** A body long enough that one printed page cannot hold it. */
const LONG_BODY = Array.from(
  { length: 40 },
  (_, index) => `<p>Paragraph ${index + 1}. ${'The quick brown fox jumps over the lazy dog. '.repeat(4)}</p>`,
).join('');

const now = new Date().toISOString();
const entry = {
  id: 'pdf1',
  title: 'A long entry: 5/6 review',
  content: LONG_BODY,
  mood: 'calm',
  tags: [],
  date: now,
  createdAt: now,
  updatedAt: now,
  isFavorite: false,
  isPrivate: false,
  wordCount: 0,
  readingTime: 0,
};

try {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    (record) => {
      window.localStorage.clear();
      window.localStorage.setItem('deardiary:entries', JSON.stringify([record]));
    },
    entry,
  );

  // 1. The PDF must paginate rather than clip, and its name must be a legal filename.
  await page.goto(`${BASE}/entry/pdf1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);

  const downloadPromise = page.waitForEvent('download', { timeout: 25000 }).catch(() => null);
  await page.getByRole('button', { name: /^Export$/ }).first().click();
  const file = await downloadPromise;
  check('PDF export fires a download', file !== null);

  if (file) {
    const name = file.suggestedFilename();
    check('PDF filename has no illegal characters', !/[\\/:*?"<>|]/.test(name), name);

    const dir = mkdtempSync(join(tmpdir(), 'deardiary-pdf-'));
    const saved = join(dir, 'entry.pdf');
    await file.saveAs(saved);
    const raw = readFileSync(saved, 'latin1');
    // jsPDF writes each page as an uncompressed /Type /Page object, so counting the
    // declarations counts the pages. A clipped export would report exactly one.
    const pages = (raw.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    check('long entry exports more than one page', pages > 1, `pages=${pages}`);
    check('PDF has the A4 page box', /MediaBox\s*\[\s*0\s+0\s+595/.test(raw), 'no A4 MediaBox found');
  }

  // 2. Ctrl+Enter publishes without inserting a hard break.
  await page.goto(`${BASE}/write`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#entry-title', 'Shortcut note');
  await page.click('.ProseMirror');
  await page.keyboard.type('Only line.');
  await page.keyboard.press('Control+Enter');
  await page.waitForTimeout(900);
  const afterShortcut = await page.evaluate(() => window.location.pathname);
  check('Ctrl+Enter navigates to the reader', /^\/entry\//.test(afterShortcut), afterShortcut);

  const published = await page.evaluate(() => document.querySelector('.entry-body')?.innerHTML ?? '');
  check('Ctrl+Enter did not insert a stray hard break', !/<br\s*\/?>/i.test(published), JSON.stringify(published.slice(0, 90)));
  check('Ctrl+Enter kept the typed text', published.includes('Only line.'), JSON.stringify(published.slice(0, 90)));
} catch (error) {
  check('script completed', false, error.message);
} finally {
  const realErrors = consoleErrors.filter((text) => !/favicon|Download the React DevTools/i.test(text));
  check('no console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));
  await browser.close();
}

console.log(results.join('\n'));
console.log(`\n${failed === 0 ? 'ALL PASS' : `${failed} FAILED`}`);
process.exit(failed === 0 ? 0 : 1);
