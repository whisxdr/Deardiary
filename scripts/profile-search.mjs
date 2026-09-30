/**
 * Profiles what the main thread does during one keystroke in the search box.
 *
 * `measure-search.mjs` proves typing is expensive; this says where. It records a CPU
 * profile across real keystrokes and prints the self-time by function, so a fix targets
 * the function that actually burns the frame rather than the one that looks suspicious.
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

const box = page.locator('input[aria-label="Search entries"]');
await box.click();
await page.waitForTimeout(400);

const client = await page.context().newCDPSession(page);
await client.send('Profiler.enable');
await client.send('Profiler.setSamplingInterval', { interval: 200 });
await client.send('Profiler.start');

await box.type('harbour', { delay: 80 });
await page.waitForTimeout(1200);

const { profile } = await client.send('Profiler.stop');

// Attribute self time per function node.
const selfTime = new Map();
const byId = new Map(profile.nodes.map((node) => [node.id, node]));
const total = profile.samples.length;

// Sample counts per node id, then convert to time using the profile duration.
const counts = new Map();
profile.samples.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
const span = (profile.endTime - profile.startTime) / 1000; // microseconds -> ms

const rows = [];
counts.forEach((count, id) => {
  const node = byId.get(id);
  if (!node) return;
  const frame = node.callFrame;
  const name = frame.functionName || '(anonymous)';
  const url = (frame.url || '').split('/').pop().split('?')[0];
  const key = `${name} @ ${url}:${frame.lineNumber + 1}`;
  selfTime.set(key, (selfTime.get(key) ?? 0) + (count / total) * span);
});

console.log(`--- one search keystroke, ${COUNT} entries, ${span.toFixed(0)} ms of profile ---`);
console.log('self time by function (top 18):');
[...selfTime.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 18)
  .forEach(([key, ms]) => {
    if (ms < 1) return;
    console.log(`  ${ms.toFixed(1).padStart(7)} ms  ${key}`);
  });

await browser.close();
