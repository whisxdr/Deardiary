/**
 * Measures the JavaScript each route actually downloads.
 *
 * The landing page was measured before, but the heavy cost lives on the other routes:
 * a barrel import can put a library on a page that never calls it. This walks every
 * route against a local production build and reports the transfer, so a change can be
 * judged by the numbers rather than by the chunk list.
 *
 * Run: `node scripts/serve-with-csp.mjs & node scripts/measure-routes.mjs`
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const require = createRequire(import.meta.url);
const { chromium } = require(`${globalRoot}/playwright`);

const BASE = process.env.BASE_URL ?? 'http://localhost:5212';
const ROUTES = ['/', '/dashboard', '/write', '/calendar', '/stats', '/settings'];

const browser = await chromium.launch();
const page = await browser.newPage();

// Same mid-range Android profile as measure-perf.mjs, so the two are comparable.
const client = await page.context().newCDPSession(page);
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
});
await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

console.log('--- per-route JS transfer: 4x CPU, ~1.6 Mbps, 150 ms RTT ---');
console.log('route          js gzip    js raw   css    files');

for (const route of ROUTES) {
  const requests = [];
  const onFinished = async (request) => {
    const sizes = await request.sizes().catch(() => null);
    requests.push({
      url: request.url(),
      type: request.resourceType(),
      bytes: sizes?.responseBodySize ?? 0,
    });
  };
  page.on('requestfinished', onFinished);

  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  // Give the lazy route chunk and any deferred work a moment to settle.
  await page.waitForTimeout(1200);
  page.off('requestfinished', onFinished);

  const sum = (type) => requests.filter((r) => r.type === type).reduce((a, r) => a + r.bytes, 0);
  const js = requests.filter((r) => r.type === 'script');
  const unique = [...new Set(js.map((r) => r.url))];

  // Real gzip size of the scripts that were actually fetched on this route.
  const gzip = await page.evaluate(async (urls) => {
    const stream = (bytes) =>
      new Response(
        new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')),
      ).arrayBuffer();
    let total = 0;
    for (const url of urls) {
      const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
      total += (await stream(bytes)).byteLength;
    }
    return total;
  }, unique);

  console.log(
    `${route.padEnd(13)} ${(gzip / 1024).toFixed(1).padStart(9)} ${(sum('script') / 1024)
      .toFixed(1)
      .padStart(9)} ${(sum('stylesheet') / 1024).toFixed(1).padStart(6)} ${String(unique.length).padStart(7)}`,
  );
  console.log(`   ${unique.map((u) => u.split('/').pop()).sort().join(' ')}`);
}

await browser.close();
