/**
 * Smoke test: every route renders and the console stays clean.
 *
 * The perf work moved libraries into lazy chunks and marked the package
 * `sideEffects`-aware so unused barrel re-exports drop out. Both changes can fail
 * silently — a route that renders a blank shell still returns 200 — so this checks
 * that each page actually produced content and logged no error.
 *
 * Run: `node scripts/serve-with-csp.mjs & node scripts/smoke-routes.mjs`
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
const problems = [];

page.on('console', (message) => {
  if (message.type() === 'error') problems.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));

let failed = false;
for (const route of ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const rendered = await page.evaluate(() => document.body.innerText.trim().length);
  const ok = rendered > 40;
  if (!ok) failed = true;
  console.log(`${route.padEnd(12)} rendered=${String(rendered).padStart(5)} chars  ${ok ? 'ok' : 'BLANK'}`);
}

console.log(problems.length ? `\nproblems:\n${problems.join('\n')}` : '\nno console errors');
await browser.close();
process.exit(failed || problems.length ? 1 : 0);
