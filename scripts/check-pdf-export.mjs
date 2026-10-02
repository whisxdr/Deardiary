/**
 * Verifies the reader's PDF export still works after jsPDF and html2canvas moved to a
 * dynamic import.
 *
 * The perf fix made those two libraries load only when the export runs. That is exactly
 * the kind of change that keeps the bundle small while breaking the one button that used
 * them, so this drives the real button and asserts a download was produced.
 *
 * Run: `node scripts/serve-with-csp.mjs & node scripts/check-pdf-export.mjs`
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

const browser = await chromium.launch();
const page = await browser.newPage();
const problems = [];
page.on('pageerror', (error) => problems.push(error.message));

const day = new Date().toISOString();
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate(
  (at) => {
    window.localStorage.clear();
    window.localStorage.setItem(
      'deardiary:entries',
      JSON.stringify([
        {
          id: 'pdf1',
          title: 'Export probe',
          content: '<p>Paragraph one.</p><p>Paragraph two.</p>',
          mood: 'calm',
          tags: ['work'],
          date: at,
          createdAt: at,
          updatedAt: at,
          isFavorite: false,
          isPrivate: false,
          wordCount: 4,
          readingTime: 1,
        },
      ]),
    );
  },
  day,
);

await page.goto(`${BASE}/entry/pdf1`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// The jspdf chunk must NOT be on the wire yet — that is the whole point of the change.
const beforeExport = await page.evaluate(() =>
  performance.getEntriesByType('resource').filter((entry) => /jspdf|html2canvas/.test(entry.name)).length,
);

let download = null;
try {
  // The PDF action is the button labelled exactly "Export"; the other two read
  // "Export Markdown" and "Export plain text", so an exact name avoids them.
  const [item] = await Promise.all([
    page.waitForEvent('download', { timeout: 20000 }),
    page.getByRole('button', { name: 'Export', exact: true }).first().click(),
  ]);
  download = item;
} catch (error) {
  problems.push(`no download: ${error.message}`);
}

const suggested = download ? download.suggestedFilename() : null;
const afterExport = await page.evaluate(() =>
  performance.getEntriesByType('resource').filter((entry) => /jspdf|html2canvas/.test(entry.name)).length,
);

console.log(`pdf libs on wire before export: ${beforeExport}`);
console.log(`pdf libs on wire after export:  ${afterExport}`);
console.log(`download: ${suggested ?? 'none'}`);
console.log(problems.length ? `\nproblems:\n${problems.join('\n')}` : '\nno page errors');

const ok = beforeExport === 0 && afterExport > 0 && Boolean(suggested?.endsWith('.pdf')) && problems.length === 0;
console.log(ok ? '\nPASS' : '\nFAIL');
await browser.close();
process.exit(ok ? 0 : 1);
