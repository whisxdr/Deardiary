/**
 * Does a page navigation abort an in-flight fetch?
 *
 * The sync race test navigates while a pull is pending. If navigation aborts the fetch,
 * the pull never completes, the write-back never runs, and the test proves nothing.
 * Settling that question decides whether the race test is valid.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const require = createRequire(import.meta.url);
const { chromium } = require(`${globalRoot}/playwright`);

// A tiny server whose response is slow, so a navigation can happen while it is pending.
const server = createServer((req, res) => {
  if (req.url === '/slow') {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    }, 3000);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<!doctype html><title>probe</title><body>page</body>');
});

await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const BASE = `http://localhost:${port}`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(BASE);

// Start a slow fetch, then navigate away before it can finish.
await page.evaluate(() => {
  window.__fetchResult = 'pending';
  fetch('/slow')
    .then(() => {
      window.__fetchResult = 'resolved';
    })
    .catch((error) => {
      window.__fetchResult = `rejected: ${error.name}`;
    });
});
await page.waitForTimeout(300);
await page.goto(`${BASE}/other`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(4000);

const afterNavigation = await page.evaluate(() => window.__fetchResult ?? 'gone (new document)');
console.log(`fetch result after navigating away: ${afterNavigation}`);

// And the same without navigation, as a control.
await page.evaluate(() => {
  window.__fetchResult2 = 'pending';
  fetch('/slow')
    .then(() => {
      window.__fetchResult2 = 'resolved';
    })
    .catch((error) => {
      window.__fetchResult2 = `rejected: ${error.name}`;
    });
});
await page.waitForTimeout(4000);
const control = await page.evaluate(() => window.__fetchResult2);
console.log(`fetch result without navigating:    ${control}`);

console.log(
  `\nCONCLUSION: navigation ${afterNavigation === 'resolved' ? 'does NOT abort' : 'ABORTS'} the pending fetch, ` +
    `so a race test that navigates mid-pull ${afterNavigation === 'resolved' ? 'is valid' : 'cannot trigger the race'}.`,
);

await browser.close();
server.close();
