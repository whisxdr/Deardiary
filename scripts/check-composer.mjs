/**
 * Verifies the composer's "New entry" behaviour against the built bundle.
 *
 * The reported bug: opening a new entry kept the previous note, which reads as a stuck
 * cache. Two causes were fixed — the stored draft was loaded by default, and the Tiptap
 * body outlived a route change. This drives the real UI through both paths.
 *
 * Run with the CSP server up: `node scripts/serve-with-csp.mjs`.
 *
 * Playwright is installed globally rather than as a project dependency, and neither
 * NODE_PATH nor ESM named-export detection reaches it from here, so it is loaded
 * through `createRequire` against the global root.
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

/** Reads the composer's body text and title through the real DOM. */
async function composerState() {
  return page.evaluate(() => ({
    title: document.querySelector('#entry-title')?.value ?? null,
    body: document.querySelector('.ProseMirror')?.textContent ?? null,
    url: window.location.pathname + window.location.search,
  }));
}

try {
  // Start from a clean diary so the draft path is the only thing under test.
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.localStorage.clear());

  // 1. Write a new entry and leave it as a draft.
  await page.goto(`${BASE}/write`, { waitUntil: 'networkidle' });
  await page.fill('#entry-title', 'First note');
  await page.click('.ProseMirror');
  await page.keyboard.type('Body of the first note.');
  await page.keyboard.press('Control+s');
  await page.waitForTimeout(300);

  const draftWritten = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem('deardiary:draft') ?? 'null'),
  );
  check('Save draft writes the draft key', draftWritten?.title === 'First note', JSON.stringify(draftWritten?.title));

  // 2. The reported bug: "New entry" from the editor must open a clean page.
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await page.click('a[href="/write"]');
  await page.waitForTimeout(600);
  const afterNewEntry = await composerState();
  check('New entry opens an empty title', afterNewEntry.title === '', JSON.stringify(afterNewEntry.title));
  check(
    'New entry opens an empty body',
    (afterNewEntry.body ?? '').trim() === '',
    JSON.stringify((afterNewEntry.body ?? '').slice(0, 40)),
  );

  // 3. "Continue Writing" must still resume the draft.
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const continueButton = page.getByRole('button', { name: /Continue Writing/i });
  check('Landing offers Continue Writing while a draft exists', (await continueButton.count()) > 0);
  await continueButton.first().click();
  await page.waitForTimeout(700);
  const resumed = await composerState();
  check('Continue Writing restores the draft title', resumed.title === 'First note', JSON.stringify(resumed.title));
  check(
    'Continue Writing restores the draft body',
    (resumed.body ?? '').includes('Body of the first note'),
    JSON.stringify((resumed.body ?? '').slice(0, 40)),
  );

  // 4. Editing an entry, then pressing New entry, must not carry the body over.
  await page.click('button:has-text("Publish")');
  await page.waitForTimeout(700);
  const published = await composerState();
  check('Publish navigates to the reader', /^\/entry\//.test(published.url), published.url);

  const readerId = published.url.split('/').pop();
  await page.goto(`${BASE}/write/${readerId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const editing = await composerState();
  check(
    'Editing an entry loads its body',
    (editing.body ?? '').includes('Body of the first note'),
    JSON.stringify((editing.body ?? '').slice(0, 40)),
  );

  // "New entry" lives in the account menu on the composer page.
  await page.click('button[aria-label="Account menu"]');
  await page.click('a[role="menuitem"][href="/write"]');
  await page.waitForTimeout(600);
  const afterEdit = await composerState();
  check(
    'New entry from an edited entry clears the body',
    (afterEdit.body ?? '').trim() === '',
    JSON.stringify((afterEdit.body ?? '').slice(0, 40)),
  );
  check('New entry from an edited entry clears the title', afterEdit.title === '', JSON.stringify(afterEdit.title));

  // 5. A deep link to a missing entry must not render a composer that claims to save.
  await page.goto(`${BASE}/write/does-not-exist`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const missing = await page.evaluate(() => ({
    hasEditor: document.querySelector('.ProseMirror') !== null,
    text: document.body.textContent ?? '',
  }));
  check('Missing entry shows the not-found state', !missing.hasEditor && missing.text.includes('missing'), `editor=${missing.hasEditor}`);

  // 6. The draft must not survive publishing the entry that resumed it.
  const draftAfterPublish = await page.evaluate(() => window.localStorage.getItem('deardiary:draft'));
  check('Publishing clears the resumed draft', draftAfterPublish === null, JSON.stringify(draftAfterPublish?.slice(0, 40)));

  // 7. An in-progress edit must reach storage when the user leaves for a new entry.
  //    This was the silent-loss case: the route switch dropped the pending autosave.
  await page.goto(`${BASE}/write/${readerId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.click('.ProseMirror');
  await page.keyboard.press('End');
  await page.keyboard.type(' Appended while editing.');
  // No wait for the idle timer: leaving immediately is the case that used to lose it.
  await page.click('button[aria-label="Account menu"]');
  await page.click('a[role="menuitem"][href="/write"]');
  await page.waitForTimeout(700);
  const stored = await page.evaluate((targetId) => {
    const list = JSON.parse(window.localStorage.getItem('deardiary:entries') ?? '[]');
    return list.find((entry) => entry.id === targetId)?.content ?? '';
  }, readerId);
  check('Leaving mid-edit saves the pending change', stored.includes('Appended while editing'), JSON.stringify(stored.slice(-40)));

  // 8. A second tab's write must not be reverted by this tab's stale form.
  await page.goto(`${BASE}/write/${readerId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  // Another tab edits the same entry behind our back, then this tab saves.
  await page.evaluate((targetId) => {
    const list = JSON.parse(window.localStorage.getItem('deardiary:entries') ?? '[]');
    const target = list.find((item) => item.id === targetId);
    if (target) {
      target.content = '<p>Written by the other tab.</p>';
      target.updatedAt = new Date(Date.now() + 60000).toISOString();
      window.localStorage.setItem('deardiary:entries', JSON.stringify(list));
    }
  }, readerId);
  await page.click('.ProseMirror');
  await page.keyboard.press('End');
  await page.keyboard.type(' From the stale tab.');
  await page.keyboard.press('Control+s');
  await page.waitForTimeout(700);
  const conflictView = await page.evaluate(() => document.body.textContent ?? '');
  const storedAfterConflict = await page.evaluate((targetId) => {
    const list = JSON.parse(window.localStorage.getItem('deardiary:entries') ?? '[]');
    return list.find((item) => item.id === targetId)?.content ?? '';
  }, readerId);
  check('Stale tab reports the conflict', /changed in another tab/i.test(conflictView), JSON.stringify(conflictView.slice(0, 80)));
  check(
    'Stale tab does not overwrite the other tab',
    storedAfterConflict.includes('Written by the other tab'),
    JSON.stringify(storedAfterConflict.slice(0, 60)),
  );
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
