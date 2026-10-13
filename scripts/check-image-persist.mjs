/**
 * End-to-end proof that an uploaded photo survives publish and reload.
 *
 * The bug this guards: the 20,000 character content cap was a plain `.slice()` over the
 * whole body, and a base64 photo runs to hundreds of thousands of characters, so the
 * first save cut the data URL to a fragment and the entry came back with a broken or
 * missing image. `check-content-clip.mjs` proves the clip arithmetic against stand-in
 * payloads; this suite drives the real path — file input, canvas decode, Tiptap insert,
 * autosave, publish, reader render, reload — against a local dev server, because the
 * pieces that can still drop the image (localStorage quota, DOMPurify on read, the
 * `allowBase64` parse flag) only exist in a browser.
 *
 * The photo is generated in-page as noisy JPEG: a solid-color photo compresses to a few
 * kilobytes and its base64 would fit under the old cap, passing even the broken build.
 *
 * Uses a fresh browser context, so it never reads or writes a real diary profile.
 *
 * Run: `node scripts/check-image-persist.mjs` (expects `npm run dev` on PORT, default 5199)
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const require = createRequire(import.meta.url);
const { chromium } = require(`${globalRoot}/playwright`);

const BASE = process.env.BASE_URL ?? 'http://localhost:5199';
const results = [];
let failed = 0;

function check(name, pass, detail) {
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!pass) failed += 1;
}

const browser = await chromium.launch();
// Fresh context: empty localStorage, no real profile touched.
const page = await browser.newPage();
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

try {
  await page.goto(`${BASE}/write`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.ProseMirror', { timeout: 20_000 });

  // A noisy 1200x900 JPEG: ~300-500 KB, so its base URL is well over the 20k cap —
  // the exact shape the old slice cut in half.
  const photo = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    const data = ctx.createImageData(canvas.width, canvas.height);
    for (let i = 0; i < data.data.length; i += 4) {
      data.data[i] = Math.random() * 255;
      data.data[i + 1] = Math.random() * 255;
      data.data[i + 2] = Math.random() * 255;
      data.data[i + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
    const url = canvas.toDataURL('image/jpeg', 0.8);
    return { dataUrl: url, base64: url.slice(url.indexOf(',') + 1) };
  });
  const payloadChars = photo.base64.length;
  check('the test photo exceeds the content cap as base64', payloadChars > 20_000, `payload=${payloadChars} chars`);

  await page.setInputFiles('input[type="file"]', {
    name: 'photo.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from(photo.base64, 'base64'),
  });

  // The editor holds the image with a data: URL after the canvas round-trip.
  await page.waitForFunction(
    () => {
      const img = document.querySelector('.ProseMirror img');
      return img instanceof HTMLImageElement && img.src.startsWith('data:image/jpeg');
    },
    { timeout: 20_000 },
  );
  check('the editor shows the uploaded photo', true);

  await page.getByRole('button', { name: 'Publish' }).click();
  await page.waitForURL(/\/entry\//, { timeout: 20_000 });

  // A 900 KB data URL takes a moment to decode; wait for a rendered image, not just a tag.
  await page.waitForFunction(
    () => {
      const img = document.querySelector('.entry-body img');
      return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
    },
    { timeout: 20_000 },
  );
  check('the reader renders the photo after publish', true);

  // The regression proper: reload the reader and check the image is still there.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const img = document.querySelector('.entry-body img');
      return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
    },
    { timeout: 20_000 },
  );
  check('the photo survives a reload', true);

  // The stored entry itself must carry the full payload, not a fragment.
  const storedOk = await page.evaluate(() => {
    const raw = window.localStorage.getItem('deardiary:entries') ?? '';
    return raw.includes('data:image/jpeg;base64,') && raw.length > 100_000;
  });
  check('the stored entry carries the full photo', storedOk);

  check('no console errors during the flow', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '));
} catch (error) {
  check('the flow ran to completion', false, error instanceof Error ? error.message : String(error));
} finally {
  await browser.close();
}

console.log('\n# image persists across publish and reload');
console.log(results.join('\n'));
console.log(failed === 0 ? 'ALL PASS' : `${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
