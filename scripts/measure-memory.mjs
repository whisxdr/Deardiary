/**
 * Measures heap, DOM size and paint timings of the local production build.
 *
 * The complaint is memory on a phone, and the numbers that matter are not on screen for
 * a human: how much JS heap a route holds, how many DOM nodes it keeps alive, and when it
 * paints. This seeds a dataset of a given size into localStorage first, then walks the
 * routes and reports what the browser actually holds.
 *
 * Run with the production bundle served over the real headers:
 *   npm run build
 *   node scripts/serve-with-csp.mjs
 *   node scripts/measure-memory.mjs [entryCount] [--images] [--cpu 4] [--slow]
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const require = createRequire(import.meta.url);
const { chromium } = require(`${globalRoot}/playwright`);

const args = process.argv.slice(2);
const BASE = process.env.BASE_URL ?? 'http://localhost:5212';
const ENTRY_COUNT = Number(args.find((item) => /^\d+$/.test(item)) ?? 250);
const WITH_IMAGES = args.includes('--images');
const SLOW = args.includes('--slow');
const cpuIndex = args.indexOf('--cpu');
const CPU_RATE = cpuIndex === -1 ? 1 : Number(args[cpuIndex + 1] ?? 4);
const ROUTES = ['/dashboard', '/calendar', '/stats', '/settings', '/write'];

/** A 1x1 red PNG, repeated to a realistic inline-image size (~48 KB). */
const IMAGE_DATA = `data:image/png;base64,${'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=='.repeat(
  40,
)}`;

/** Builds an entry the shape the app expects, parsed out of the same storage key. */
function makeEntry(index) {
  const body = Array.from({ length: 12 }, (_, line) => `<p>Entry ${index} paragraph ${line} with a handful of ordinary diary words in it.</p>`).join('');
  const image = WITH_IMAGES && index % 50 === 0 ? `<img src="${IMAGE_DATA}" alt="Photo">` : '';
  const day = new Date(2026, 0, 1 + (index % 300)).toISOString();
  return {
    id: `seed-${index}`,
    title: `Seeded entry ${index}`,
    content: `${body}${image}`,
    mood: ['calm', 'happy', 'tired', 'anxious'][index % 4],
    tags: [`tag-${index % 12}`, 'seed'],
    isFavorite: index % 7 === 0,
    isPrivate: index % 11 === 0,
    createdAt: day,
    updatedAt: day,
  };
}

const entries = Array.from({ length: ENTRY_COUNT }, (_, index) => makeEntry(index));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 412, height: 915 } });

if (CPU_RATE > 1 || SLOW) {
  const client = await page.context().newCDPSession(page);
  if (CPU_RATE > 1) await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_RATE });
  if (SLOW) {
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
  }
}

const payloadKB = (JSON.stringify(entries).length / 1024).toFixed(0);
console.log(
  `--- ${ENTRY_COUNT} entries, ${payloadKB} KB stored${WITH_IMAGES ? ', inline images every 50' : ''}, cpu ${CPU_RATE}x${SLOW ? ', slow 4G' : ''} ---`,
);

const rows = [];
for (const route of ROUTES) {
  // The dataset is written before any app script runs, so hydrate sees it on first paint.
  await page.addInitScript(
    ([key, data]) => {
      window.localStorage.setItem(key, JSON.stringify(data));
      window.localStorage.setItem('deardiary:settings', JSON.stringify({ privacy: { hidePrivateEntries: false } }));
      window.sessionStorage.setItem('deardiary:splash-shown', '1');
    },
    ['deardiary:entries', entries],
  );

  await page.goto(`${BASE}${route}`, { waitUntil: 'load' });
  await page.waitForTimeout(2500);

  const jsHeap = await page.evaluate(() =>
    typeof performance.memory === 'undefined' ? null : Math.round(performance.memory.usedJSHeapSize / 1024),
  );
  const nodes = await page.evaluate(() => document.getElementsByTagName('*').length);
  const paint = await page.evaluate(() => {
    const fcp = performance.getEntriesByType('paint').find((item) => item.name === 'first-contentful-paint');
    return { fcp: Math.round(fcp?.startTime ?? 0) };
  });
  const metrics = await page.context().newCDPSession(page).then(async (client) => {
    await client.send('Performance.enable');
    const { metrics: list } = await client.send('Performance.getMetrics');
    const find = (name) => list.find((item) => item.name === name)?.value ?? 0;
    return {
      heapUsedMB: +(find('JSHeapUsedSize') / 1024 / 1024).toFixed(1),
      heapTotalMB: +(find('JSHeapTotalSize') / 1024 / 1024).toFixed(1),
      domNodes: find('Nodes'),
      listeners: find('JSEventListeners'),
    };
  });

  rows.push({ route, ...metrics, performanceMB: +(jsHeap / 1024).toFixed(1), fcp: paint.fcp, dom: nodes });
  // Force a fresh window so one route's heap cannot be blamed on the previous one.
  await page.evaluate(() => window.localStorage.clear()).catch(() => {});
}

console.log(
  ['route'.padEnd(12), 'heapMB'.padStart(7), 'perfMB'.padStart(7), 'totalMB'.padStart(8), 'nodes'.padStart(6), 'listeners'.padStart(9), 'fcp'.padStart(6)].join(''),
);
rows.forEach((row) => {
  console.log(
    [
      row.route.padEnd(12),
      String(row.heapUsedMB).padStart(7),
      String(row.performanceMB).padStart(7),
      String(row.heapTotalMB).padStart(8),
      String(row.dom).padStart(6),
      String(row.listeners).padStart(9),
      String(row.fcp).padStart(6),
    ].join(''),
  );
});

await browser.close();
