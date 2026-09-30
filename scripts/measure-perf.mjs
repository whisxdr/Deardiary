/**
 * Measures what a phone actually downloads and when it can paint.
 *
 * The complaint is lag on mobile, and the earlier round removed the render-blocking
 * font chain and the date-fns chunk. This re-measures the deployed site under a mobile
 * profile — 4x CPU slowdown and a slow-4G link — and reports the numbers rather than a
 * verdict, because the in-app browser cannot expose LCP itself.
 *
 * Run: `node scripts/measure-perf.mjs`
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const require = createRequire(import.meta.url);
const { chromium } = require(`${globalRoot}/playwright`);

const BASE = process.env.BASE_URL ?? 'https://dearmydiary-eight.vercel.app';
const browser = await chromium.launch();
const page = await browser.newPage();

// Roughly a mid-range Android on slow 4G.
const client = await page.context().newCDPSession(page);
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
});
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

const requests = [];
page.on('requestfinished', async (request) => {
  const response = await request.response();
  const sizes = await request.sizes().catch(() => null);
  requests.push({
    url: request.url(),
    type: request.resourceType(),
    status: response?.status() ?? 0,
    bytes: sizes?.responseBodySize ?? 0,
  });
});

const started = Date.now();
await page.goto(BASE, { waitUntil: 'load' });
const loadMs = Date.now() - started;

// First contentful paint and the layout shift the user would see.
const metrics = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const nav = performance.getEntriesByType('navigation')[0];
      let cls = 0;
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) cls += entry.value;
        });
      }).observe({ type: 'layout-shift', buffered: true });

      // LCP is only observable until the first input; read what was buffered.
      let lcp = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        lcp = entries[entries.length - 1]?.startTime ?? 0;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      const paint = performance.getEntriesByType('paint').find((entry) => entry.name === 'first-contentful-paint');
      setTimeout(
        () =>
          resolve({
            fcp: paint?.startTime ?? 0,
            lcp,
            cls,
            domContentLoaded: nav?.domContentLoadedEventEnd ?? 0,
            transferKB: 0,
          }),
        1500,
      );
    }),
);

const total = requests.reduce((sum, item) => sum + item.bytes, 0);
const byType = {};
requests.forEach((item) => {
  byType[item.type] = (byType[item.type] ?? 0) + item.bytes;
});
const external = requests.filter((item) => !item.url.startsWith(BASE) && !item.url.startsWith('data:'));

console.log('--- mobile profile: 4x CPU slowdown, ~1.6 Mbps, 150 ms RTT ---');
console.log(`load event              ${loadMs} ms`);
console.log(`first contentful paint  ${Math.round(metrics.fcp)} ms`);
console.log(`largest contentful paint ${Math.round(metrics.lcp)} ms`);
console.log(`cumulative layout shift ${metrics.cls.toFixed(4)}`);
console.log(`requests                ${requests.length}`);
console.log(`transfer                ${(total / 1024).toFixed(1)} KB`);
console.log('by type:');
Object.entries(byType)
  .sort((a, b) => b[1] - a[1])
  .forEach(([type, bytes]) => console.log(`  ${type.padEnd(12)} ${(bytes / 1024).toFixed(1)} KB`));
console.log(`external origins        ${external.length === 0 ? 'none' : external.map((item) => item.url).join(', ')}`);
console.log('\nheaviest:');
requests
  .slice()
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 8)
  .forEach((item) => console.log(`  ${(item.bytes / 1024).toFixed(1).padStart(7)} KB  ${item.url.replace(BASE, '')}`));

await browser.close();
