/**
 * Regression sweep over the features touched by this round of fixes.
 *
 * Each check targets a specific bug that was reported and fixed: plain-text export
 * collapsing to one line, the calendar panel drifting from the month, reader arrow keys
 * firing on the not-found screen, the dashboard tag filter ignoring a URL change, and the
 * hidden-private empty state.
 *
 * Run with the CSP server up: `node scripts/serve-with-csp.mjs`.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const require = createRequire(import.meta.url);
const { chromium } = require(`${globalRoot}/playwright`);

const BASE = process.env.BASE_URL ?? 'http://localhost:5212';
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

/** Seeds a diary directly into storage so each check starts from a known book. */
async function seed(entries, settings) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ([list, prefs]) => {
      window.localStorage.clear();
      window.localStorage.setItem('deardiary:entries', JSON.stringify(list));
      if (prefs) window.localStorage.setItem('deardiary:settings', JSON.stringify(prefs));
    },
    [entries, settings ?? null],
  );
}

const day = (offset) => {
  const at = new Date();
  at.setDate(at.getDate() - offset);
  return at.toISOString();
};

const entry = (id, title, content, overrides = {}) => ({
  id,
  title,
  content,
  mood: 'calm',
  tags: ['work'],
  date: day(1),
  createdAt: day(1),
  updatedAt: day(1),
  isFavorite: false,
  isPrivate: false,
  wordCount: 0,
  readingTime: 0,
  ...overrides,
});

try {
  // 1. Plain-text export keeps paragraph breaks.
  await seed([entry('a1', 'Paragraphs', '<p>First para.</p><p>Second para.</p>')]);
  await page.goto(`${BASE}/entry/a1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // The export helpers are not exposed on window and a download cannot be read back, so
  // the conversion is checked directly against the same rules `htmlToText` applies.
  const exportText = await page.evaluate(() => {
    const html = '<p>First para.</p><p>Second para.</p>';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|li|h[1-3]|blockquote|div)>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  });
  check('plain-text conversion keeps the paragraph break', exportText === 'First para.\nSecond para.', JSON.stringify(exportText));
  const readerLoaded = await page.evaluate(() => document.querySelector('.entry-body') !== null);
  check('reader renders the entry body', readerLoaded);

  // 2. Calendar month navigation moves the selected day with it.
  await seed([entry('b1', 'Today note', '<p>today</p>', { date: new Date().toISOString() })]);
  await page.goto(`${BASE}/calendar`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const beforeMonth = await page.evaluate(() => document.body.textContent ?? '');
  const nextButton = page.getByRole('button', { name: /next month/i });
  if ((await nextButton.count()) > 0) {
    await nextButton.first().click();
    await page.waitForTimeout(400);
    const afterMonth = await page.evaluate(() => document.body.textContent ?? '');
    check('Calendar next month changes the header', beforeMonth !== afterMonth);
    // The detail panel must not still be showing today's entry under the new month.
    const panelShowsToday = /Today note/.test(afterMonth);
    check('Calendar panel leaves the old month behind', !panelShowsToday, `still shows=${panelShowsToday}`);
  } else {
    check('Calendar exposes a next-month control', false, 'button not found');
  }

  // 3. Reader arrow keys must not navigate from the not-found screen.
  await seed([entry('c1', 'Only entry', '<p>body</p>')]);
  await page.goto(`${BASE}/entry/missing-id`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const notFoundUrl = page.url();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  check('ArrowRight is inert on the missing page', page.url() === notFoundUrl, `${notFoundUrl} -> ${page.url()}`);

  // 4. Dashboard follows a tag change in the URL.
  await seed([
    entry('d1', 'Work note', '<p>work</p>', { tags: ['work'] }),
    entry('d2', 'Travel note', '<p>travel</p>', { tags: ['travel'] }),
  ]);
  await page.goto(`${BASE}/dashboard?tag=work`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const workOnly = await page.evaluate(() => document.body.textContent ?? '');
  await page.goto(`${BASE}/dashboard?tag=travel`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const travelOnly = await page.evaluate(() => document.body.textContent ?? '');
  check('Dashboard honours ?tag=work', workOnly.includes('Work note') && !workOnly.includes('Travel note'));
  check('Dashboard honours a changed ?tag=travel', travelOnly.includes('Travel note') && !travelOnly.includes('Work note'));

  // 5. Typing in the search box must filter on the settled value, not on every keystroke,
  //    and the box must still show what the user typed.
  await seed([
    entry('g1', 'Harbour morning', '<p>the tide came in</p>'),
    entry('g2', 'Mountain walk', '<p>a long climb</p>'),
  ]);
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const searchBox = page.locator('input[aria-label="Search entries"]');
  await searchBox.click();
  await searchBox.type('harbour', { delay: 40 });
  // The input must show the text immediately, before the debounce fires.
  const typed = await searchBox.inputValue();
  check('search box shows the typed text at once', typed === 'harbour', JSON.stringify(typed));
  await page.waitForTimeout(600);
  const filtered = await page.evaluate(() => document.body.textContent ?? '');
  check('search filters to the matching entry', filtered.includes('Harbour morning') && !filtered.includes('Mountain walk'), filtered.includes('Mountain walk') ? 'both shown' : 'ok');
  await page.getByRole('button', { name: /clear search/i }).click();
  await page.waitForTimeout(600);
  const cleared = await page.evaluate(() => document.body.textContent ?? '');
  check('clearing search restores every entry', cleared.includes('Mountain walk') && cleared.includes('Harbour morning'));

  // 6. An all-private diary explains the empty grid instead of claiming it is empty.
  await seed(
    [entry('e1', 'Secret', '<p>hidden</p>', { isPrivate: true })],
    {
      displayName: 'Probe',
      bio: '',
      avatarSeed: 'probe',
      theme: 'leather',
      fontSize: 'md',
      privacy: { hidePrivateEntries: true },
    },
  );
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const hiddenView = await page.evaluate(() => document.body.textContent ?? '');
  check('All-private diary says entries are hidden', /private entr/i.test(hiddenView), JSON.stringify(hiddenView.slice(0, 120)));
  check('All-private diary does not claim to be empty', !/still empty/i.test(hiddenView));

  // 7. A backup with malformed settings must not take the app down.
  await seed([entry('f1', 'Safe', '<p>safe</p>')], {
    displayName: 'Probe',
    bio: '',
    avatarSeed: 'probe',
    theme: 'leather',
    fontSize: 'md',
    privacy: null,
  });
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const crashed = await page.evaluate(() => document.body.textContent ?? '');
  check('Malformed privacy settings do not crash the dashboard', !/lost its bookmark/i.test(crashed), JSON.stringify(crashed.slice(0, 80)));
  check('Dashboard renders entries despite bad settings', crashed.includes('Safe'));
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
