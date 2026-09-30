/**
 * Measures the cost of typing in the search box.
 *
 * The report is "no pause to type at all", which points at main-thread work on every
 * keystroke rather than the debounce (which only delays the filter, not the render).
 * This seeds a large diary, types with real keystrokes, and reports the long tasks the
 * input handler caused, so the fix can be judged against a number.
 *
 * Run with the CSP server up: `node scripts/serve-with-csp.mjs`.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const require = createRequire(import.meta.url);
const { chromium } = require(`${globalRoot}/playwright`);

const BASE = process.env.BASE_URL ?? 'http://localhost:5212';
const COUNT = Number(process.env.COUNT ?? 400);

// This script seeds its own diary, which means clearing the origin's storage first.
// Against the live site that would destroy the real diary, so refuse anything but a
// local origin rather than relying on the caller to remember.
if (!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/.test(BASE)) {
  console.error(`Refusing to run: ${BASE} is not a local origin, and this script clears storage.`);
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();

const now = Date.now();
const entries = Array.from({ length: COUNT }, (_, index) => {
  const at = new Date(now - index * 86_400_000).toISOString();
  return {
    id: `seed-${index}`,
    title: `Entry number ${index} about the harbour`,
    content: `<p>${'The tide came in over the rocks and the boats turned to face it. '.repeat(6)}</p>`,
    mood: ['calm', 'happy', 'tired', 'hopeful'][index % 4],
    tags: [`tag${index % 12}`, 'journal'],
    date: at,
    createdAt: at,
    updatedAt: at,
    isFavorite: index % 5 === 0,
    isPrivate: false,
    wordCount: 0,
    readingTime: 0,
  };
});

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate((list) => {
  window.localStorage.clear();
  window.localStorage.setItem('deardiary:entries', JSON.stringify(list));
}, entries);

await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Count the cards the browser actually built, so "400 entries" is not an assumption.
const rendered = await page.evaluate(() => document.querySelectorAll('article').length);

// Long tasks are the machine-visible form of "it stutters while I type".
await page.evaluate(() => {
  window.__longTasks = [];
  window.__inputToFrame = [];
  new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => window.__longTasks.push(Math.round(entry.duration)));
  }).observe({ type: 'longtask', buffered: true });

  // Time from each keystroke to the next painted frame: what the user feels as lag.
  let pending = null;
  window.addEventListener(
    'input',
    () => {
      pending = performance.now();
    },
    true,
  );
  const tick = () => {
    if (pending !== null) {
      window.__inputToFrame.push(Math.round(performance.now() - pending));
      pending = null;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

const box = page.locator('input[aria-label="Search entries"]');
await box.click();
await page.waitForTimeout(300);

/**
 * One typing burst, reported from the counters reset immediately before it.
 *
 * Run twice: the first pass builds the per-entry search index, the second measures what
 * typing costs once that work is already done, which is what a user feels after the
 * first search.
 */
async function burst(text) {
  await page.evaluate(() => {
    window.__longTasks = [];
    window.__inputToFrame = [];
  });
  await box.fill('');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    window.__longTasks = [];
    window.__inputToFrame = [];
  });
  await box.type(text, { delay: 60 });
  await page.waitForTimeout(1200);
  return page.evaluate(() => {
    const tasks = window.__longTasks ?? [];
    const frames = (window.__inputToFrame ?? []).slice().sort((a, b) => a - b);
    return {
      longTaskCount: tasks.length,
      longTaskTotal: tasks.reduce((sum, value) => sum + value, 0),
      longTaskWorst: tasks.length ? Math.max(...tasks) : 0,
      frameMedian: frames.length ? frames[Math.floor(frames.length / 2)] : 0,
      frameWorst: frames.length ? frames[frames.length - 1] : 0,
    };
  });
}

// Real keystrokes, not fill(): React only sees onChange from genuine input events.
const cold = await burst('harbour tide');
const warm = await burst('harbour tide');

const stats = { ...warm, coldLongTaskWorst: cold.longTaskWorst, finalCount: await page.evaluate(() => document.querySelectorAll('article').length) };

console.log(`--- typing in search, ${COUNT} entries, ${rendered} cards mounted ---`);
console.log(`long tasks during typing  ${stats.longTaskCount} (total ${stats.longTaskTotal} ms, worst ${stats.longTaskWorst} ms)`);
console.log(`keystroke -> next frame   median ${stats.frameMedian} ms, worst ${stats.frameWorst} ms`);
console.log(`first-search worst task   ${stats.coldLongTaskWorst} ms (index build)`);
console.log(`cards after filtering     ${stats.finalCount}`);

await browser.close();
