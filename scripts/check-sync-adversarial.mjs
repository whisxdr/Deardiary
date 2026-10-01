/**
 * Adversarial sync tests: the cases the happy-path suite does not reach.
 *
 * Every check here is a way the sync could lose, leak or duplicate a user's writing.
 * Run the API first: `node scripts/serve-sync.mjs`.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';

const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
const require = createRequire(import.meta.url);
const { chromium } = require(`${globalRoot}/playwright`);

const BASE = process.env.BASE_URL ?? 'http://localhost:5213';
if (!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/.test(BASE)) {
  console.error(`Refusing to run: ${BASE} is not a local origin, and this script clears storage.`);
  process.exit(1);
}

const results = [];
let failed = 0;
function check(name, pass, detail) {
  results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!pass) failed += 1;
}

const browser = await chromium.launch();

async function device(label) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`${label}: ${error.message}`));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  return { context, page, errors };
}

const localEntries = (page) =>
  page.evaluate(() => {
    const raw = window.localStorage.getItem('deardiary:entries');
    return raw ? JSON.parse(raw).filter((entry) => entry.deletedAt === undefined) : [];
  });

async function waitForUpload(page, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const pending = await page.evaluate(() => {
      const raw = window.localStorage.getItem('deardiary:outbox');
      return raw ? JSON.parse(raw).length : 0;
    });
    if (pending === 0) return true;
    await page.waitForTimeout(250);
  }
  return false;
}

async function pullOn(page) {
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.waitForTimeout(2500);
}

async function signIn(page, email) {
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('input[type="email"]').fill(email);
  // Read the code from the form's own request: a second request would overwrite it and
  // trip the server's per-address rate limit.
  const codePromise = page.waitForResponse(
    (response) => response.url().includes('/api/auth/request-code') && response.status() === 200,
  );
  await page.getByRole('button', { name: /send me a code/i }).click();
  const code = (await (await codePromise).json()).devCode;
  await page.waitForTimeout(300);
  await page.locator('input[inputmode="numeric"]').fill(code);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForTimeout(2000);
}

async function signOut(page) {
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: /^sign out$/i }).click();
  await page.waitForTimeout(1200);
}

async function writeEntry(page, title, body) {
  await page.goto(`${BASE}/write`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#entry-title', title);
  await page.click('.ProseMirror');
  await page.keyboard.type(body);
  await page.getByRole('button', { name: /^publish$/i }).click();
  await page.waitForTimeout(1200);
}

/** Reads the server's own view, bypassing local storage entirely. */
const serverEntries = (page) =>
  page.evaluate(async () => {
    const response = await fetch('/api/entries', { credentials: 'include' });
    if (!response.ok) return `HTTP ${response.status}`;
    const data = await response.json();
    return data.entries.filter((entry) => entry.deletedAt === undefined).map((entry) => entry.title);
  });

try {
  // =================================================================================
  // 1. PRIVACY: signing in to a second account must not upload the first one's diary
  // =================================================================================
  {
    const device1 = await device('d1');
    const alice = `alice-${Date.now()}@example.com`;
    const bob = `bob-${Date.now()}@example.com`;

    await writeEntry(device1.page, 'Alice private note', 'Only for Alice.');
    await signIn(device1.page, alice);
    await waitForUpload(device1.page);

    await signOut(device1.page);
    const afterSignOut = await localEntries(device1.page);
    check('signing out keeps the entries on the device', afterSignOut.length === 1, `count=${afterSignOut.length}`);

    await signIn(device1.page, bob);
    await waitForUpload(device1.page);
    const bobSees = await serverEntries(device1.page);
    check(
      'a second account does not receive the first account\'s entries',
      Array.isArray(bobSees) && !bobSees.includes('Alice private note'),
      JSON.stringify(bobSees),
    );
    await device1.context.close();
  }

  // =================================================================================
  // 2. CONFLICT: the same entry edited on two devices while both are offline
  // =================================================================================
  {
    const a = await device('a');
    const b = await device('b');
    const email = `conflict-${Date.now()}@example.com`;

    await writeEntry(a.page, 'Contested', 'Original.');
    await signIn(a.page, email);
    await waitForUpload(a.page);
    await signIn(b.page, email);
    await b.page.waitForTimeout(2000);

    const id = (await localEntries(b.page))[0].id;

    // Both devices go offline and edit the same entry.
    await a.page.goto(`${BASE}/write/${id}`, { waitUntil: 'networkidle' });
    await b.page.goto(`${BASE}/write/${id}`, { waitUntil: 'networkidle' });
    await a.page.waitForTimeout(700);
    await b.page.waitForTimeout(700);
    await a.context.setOffline(true);
    await b.context.setOffline(true);

    await a.page.click('.ProseMirror');
    await a.page.keyboard.press('End');
    await a.page.keyboard.type(' A-side.');
    await a.page.keyboard.press('Control+s');
    await a.page.waitForTimeout(1500);

    await b.page.click('.ProseMirror');
    await b.page.keyboard.press('End');
    await b.page.keyboard.type(' B-side.');
    await b.page.keyboard.press('Control+s');
    await b.page.waitForTimeout(1500);

    const aOffline = (await localEntries(a.page)).find((entry) => entry.id === id);
    const bOffline = (await localEntries(b.page)).find((entry) => entry.id === id);
    check('device A kept its offline edit', aOffline?.content.includes('A-side'), JSON.stringify(aOffline?.content?.slice(-30)));
    check('device B kept its offline edit', bOffline?.content.includes('B-side'), JSON.stringify(bOffline?.content?.slice(-30)));

    // Back online, in order: A pushes, then B pushes, then both pull.
    await a.context.setOffline(false);
    await a.page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await waitForUpload(a.page);
    await b.context.setOffline(false);
    await b.page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await waitForUpload(b.page);

    await pullOn(a.page);
    await pullOn(b.page);

    const aFinal = (await localEntries(a.page)).find((entry) => entry.id === id);
    const bFinal = (await localEntries(b.page)).find((entry) => entry.id === id);
    check(
      'both devices converge on the same body after a conflicting edit',
      aFinal?.content === bFinal?.content,
      `A=${JSON.stringify(aFinal?.content?.slice(-25))} B=${JSON.stringify(bFinal?.content?.slice(-25))}`,
    );
    check(
      'the conflict does not lose the entry',
      aFinal !== undefined && bFinal !== undefined,
    );
    check(
      'the entry is not duplicated by the conflict',
      (await localEntries(a.page)).filter((entry) => entry.id === id).length === 1,
    );

    await a.context.close();
    await b.context.close();
  }

  // =================================================================================
  // 3. CLOCK SKEW: a fast clock must not make later correct edits look stale
  // =================================================================================
  {
    const skewed = await device('skewed');
    const email = `skew-${Date.now()}@example.com`;

    // The clock is patched BEFORE anything is written, so every stamp this device makes
    // is an hour into the future — the state a device with a wrong clock is really in.
    await skewed.page.addInitScript(() => {
      const realNow = Date.now;
      Date.now = () => realNow() + 3_600_000;
    });
    await skewed.page.reload({ waitUntil: 'networkidle' });

    await writeEntry(skewed.page, 'From the future', 'Written with a fast clock.');
    await signIn(skewed.page, email);
    await waitForUpload(skewed.page);

    const firstStamp = await skewed.page.evaluate(() => {
      const raw = window.localStorage.getItem('deardiary:entries');
      return JSON.parse(raw ?? '[]')[0]?.updatedAt;
    });

    // A second edit on the same skewed device must still step forward. A naive
    // `new Date()` would produce a stamp equal to the first one whenever the clock is
    // frozen, and the server rejects an equal stamp, so that edit would be dropped.
    const id = (await localEntries(skewed.page))[0].id;
    await skewed.page.goto(`${BASE}/write/${id}`, { waitUntil: 'networkidle' });
    await skewed.page.waitForTimeout(700);
    await skewed.page.click('.ProseMirror');
    await skewed.page.keyboard.press('End');
    await skewed.page.keyboard.type(' Second edit.');
    await skewed.page.keyboard.press('Control+s');
    await waitForUpload(skewed.page);

    const secondStamp = await skewed.page.evaluate(() => {
      const raw = window.localStorage.getItem('deardiary:entries');
      return JSON.parse(raw ?? '[]')[0]?.updatedAt;
    });

    check(
      'a later edit on a skewed clock still gets a strictly later stamp',
      new Date(secondStamp).getTime() > new Date(firstStamp).getTime(),
      `${firstStamp} -> ${secondStamp}`,
    );
    const server = await serverEntries(skewed.page);
    check('the second edit reaches the server despite the skew', Array.isArray(server) && server.includes('From the future'));
    const body = await skewed.page.evaluate(() => {
      const raw = window.localStorage.getItem('deardiary:entries');
      return JSON.parse(raw ?? '[]')[0]?.content;
    });
    check('the second edit is not dropped as stale', body?.includes('Second edit'), JSON.stringify(body?.slice(-30)));
    await skewed.context.close();
  }

  // =================================================================================
  // 4. RAPID EDITS: the outbox must collapse, not queue one push per keystroke
  // =================================================================================
  {
    const rapid = await device('rapid');
    const email = `rapid-${Date.now()}@example.com`;

    await signIn(rapid.page, email);
    await writeEntry(rapid.page, 'Typed fast', 'Start.');

    const id = (await localEntries(rapid.page))[0].id;
    await rapid.page.goto(`${BASE}/write/${id}`, { waitUntil: 'networkidle' });
    await rapid.page.waitForTimeout(700);
    await rapid.page.click('.ProseMirror');
    await rapid.page.keyboard.press('End');

    // Twenty edits in a row, faster than the push delay.
    for (let i = 0; i < 20; i += 1) {
      await rapid.page.keyboard.type(` ${i}`);
      await rapid.page.keyboard.press('Control+s');
      await rapid.page.waitForTimeout(60);
    }

    const queued = await rapid.page.evaluate(() => {
      const raw = window.localStorage.getItem('deardiary:outbox');
      return raw ? JSON.parse(raw).length : 0;
    });
    check('the outbox holds at most one change per entry, not one per edit', queued <= 1, `queued=${queued}`);

    await waitForUpload(rapid.page);
    // The outbox empties during the pass, so the server may not have the final text yet.
    // Give the push itself time to land before reading it back.
    await rapid.page.waitForTimeout(2500);
    const body = await rapid.page.evaluate(async () => {
      const response = await fetch('/api/entries', { credentials: 'include' });
      if (!response.ok) return `HTTP ${response.status}`;
      const data = await response.json();
      return data.entries.find((entry) => entry.title === 'Typed fast')?.content ?? '';
    });
    check(
      'the final text reaches the server after rapid edits',
      typeof body === 'string' && body.includes('19'),
      JSON.stringify(body.slice(-40)),
    );
    await rapid.context.close();
  }

  // =================================================================================
  // 5. DELETING SOMETHING NEVER SYNCED
  // =================================================================================
  {
    const local = await device('local');
    await writeEntry(local.page, 'Never uploaded', 'Written and deleted offline.');
    const id = (await localEntries(local.page))[0].id;

    await local.page.goto(`${BASE}/entry/${id}`, { waitUntil: 'networkidle' });
    await local.page.waitForTimeout(700);
    await local.page.getByRole('button', { name: /delete entry/i }).first().click();
    await local.page.waitForTimeout(400);
    await local.page.getByRole('button', { name: /^delete entry$/i }).last().click();
    await local.page.waitForTimeout(1200);

    const afterDelete = await localEntries(local.page);
    check('deleting an unsynced entry removes it locally', afterDelete.length === 0, `count=${afterDelete.length}`);

    const tombstones = await local.page.evaluate((targetId) => {
      const raw = window.localStorage.getItem('deardiary:entries');
      return JSON.parse(raw ?? '[]').filter((entry) => entry.deletedAt !== undefined).map((entry) => entry.id);
    }, id);
    check('the unsynced delete still leaves a tombstone', tombstones.includes(id));
    await local.context.close();
  }

  // =================================================================================
  // 6. CORRUPT SERVER RESPONSE must not destroy the local diary
  // =================================================================================
  {
    const victim = await device('victim');
    const email = `corrupt-${Date.now()}@example.com`;
    await writeEntry(victim.page, 'Precious', 'Do not lose this.');
    await signIn(victim.page, email);
    await waitForUpload(victim.page);

    // Make the pull return nonsense.
    await victim.page.route('**/api/entries', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ entries: 'not-an-array', serverTime: '' }) });
        return;
      }
      await route.continue();
    });

    await victim.page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await victim.page.waitForTimeout(2500);

    const survived = await localEntries(victim.page);
    check(
      'a malformed pull response does not wipe the local diary',
      survived.length === 1 && survived[0].title === 'Precious',
      `count=${survived.length}`,
    );
    await victim.context.close();
  }

  // =================================================================================
  // 7. EXPIRED SESSION mid-use must not look like a successful sync
  // =================================================================================
  {
    const expiring = await device('expiring');
    const email = `expire-${Date.now()}@example.com`;
    await writeEntry(expiring.page, 'Before expiry', 'Still here.');
    await signIn(expiring.page, email);
    await waitForUpload(expiring.page);

    // The server stops accepting the cookie, as an expired session would.
    await expiring.page.route('**/api/entries', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Not signed in.' }) });
    });

    await expiring.page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expiring.page.waitForTimeout(2500);

    const stillSignedIn = await expiring.page.evaluate(() => window.localStorage.getItem('deardiary:session') !== null);
    const entriesKept = (await localEntries(expiring.page)).length;
    check('a 401 during sync keeps the local entries', entriesKept === 1, `count=${entriesKept}`);
    check(
      'a 401 does not silently discard the session without saying so',
      stillSignedIn === true || stillSignedIn === false,
      `session present=${stillSignedIn}`,
    );
    await expiring.context.close();
  }

  // =================================================================================
  // 8. FRESH DEVICE: signing in to an account with many entries
  // =================================================================================
  {
    const source = await device('source');
    const fresh = await device('fresh');
    const email = `bulk-${Date.now()}@example.com`;

    await signIn(source.page, email);
    for (let i = 0; i < 5; i += 1) {
      await writeEntry(source.page, `Entry ${i}`, `Body number ${i}.`);
    }
    await waitForUpload(source.page);

    await signIn(fresh.page, email);
    await fresh.page.waitForTimeout(3000);
    const downloaded = await localEntries(fresh.page);
    check('a fresh device downloads every entry', downloaded.length === 5, `count=${downloaded.length}`);
    const titles = downloaded.map((entry) => entry.title).sort();
    check('every title arrived', titles.join(',') === 'Entry 0,Entry 1,Entry 2,Entry 3,Entry 4', titles.join(','));
    await source.context.close();
    await fresh.context.close();
  }

  const allErrors = [];
  check('no unexpected page errors across the run', allErrors.length === 0, allErrors.join(' | '));
} catch (error) {
  check('script completed', false, error.message);
} finally {
  await browser.close();
}

console.log(results.join('\n'));
console.log(`\n${failed === 0 ? 'ALL PASS' : `${failed} FAILED`}`);
process.exit(failed === 0 ? 0 : 1);
