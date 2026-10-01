/**
 * The three auth/owner fixes, run against the real modules.
 *
 * F1 `clearLocalEntries` must drop the draft, not only the entries and the queue: a foreign
 *    sign-in on the same browser otherwise offers the new account "Continue Writing" over the
 *    previous owner's unfinished text. Settings are deliberately kept.
 * F2 `authFailureMessage` must pass the server's own wording through (a 429 rate limit is not
 *    a network problem) and reserve the connection text for a genuine transport failure.
 * F3 the adapter must report a wholesale push refusal instead of letting the engine read an
 *    empty accepted list as "everything stale" and stall the queue silently.
 *
 * F3 has no behavioral test here: `supabaseAdapter.push` needs a live Supabase client, and the
 * adapter module does not even load under plain Node (`EntryRow` is a type-only named import).
 * It is asserted against the source text and left for a manual Wave 3 check; see the report.
 *
 * Run: `node scripts/check-sync-push-deny.mjs`
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  claimDevice,
  clearLocalEntries,
  clearStorage,
  entry,
  loadSrc,
  reporter,
  seedRaw,
  STORAGE_KEY,
} from './check-sync-harness.mjs';

const { check, report } = reporter('auth, owner and push-refusal fixes');
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const { authFailureMessage } = await loadSrc('services/supabase/auth.ts');
const { readJson, writeJson } = await loadSrc('lib/storage.ts');
const DRAFT = STORAGE_KEY.draft;
const SETTINGS = STORAGE_KEY.settings;

// --- F1. A foreign sign-in drops the draft too -------------------------------------
{
  clearStorage();
  seedRaw([entry('alice-note')]);
  writeJson(DRAFT, { title: 'unfinished private words', content: '<p>secret</p>' });
  writeJson(SETTINGS, { displayName: 'Alice', bio: 'hi', avatar: 'a.png' });

  clearLocalEntries();

  check('the draft is gone after a clear', readJson(DRAFT, null) === null, JSON.stringify(readJson(DRAFT, null)));
  check('the entries are emptied', readJson(STORAGE_KEY.entries, null).length === 0);
  check(
    "settings survive the clear (device preference, not another account's content)",
    readJson(SETTINGS, null)?.displayName === 'Alice',
    JSON.stringify(readJson(SETTINGS, null)),
  );
}

// --- F1. The draft is dropped through the real foreign-claim path -------------------
{
  clearStorage();
  seedRaw([entry('alice-secret')]);
  writeJson(DRAFT, { title: 'alice draft' });
  globalThis.localStorage.setItem(STORAGE_KEY.owner, JSON.stringify('alice-id'));

  claimDevice('bob-id');

  check('a foreign claim drops the draft', readJson(DRAFT, null) === null, JSON.stringify(readJson(DRAFT, null)));
  check('a foreign claim still drops the entries', readJson(STORAGE_KEY.entries, null).length === 0);
}

// --- F1. A same-account claim leaves the draft alone --------------------------------
{
  clearStorage();
  writeJson(DRAFT, { title: 'mine' });
  globalThis.localStorage.setItem(STORAGE_KEY.owner, JSON.stringify('alice-id'));

  claimDevice('alice-id');

  check('a same-account claim keeps the draft', readJson(DRAFT, null)?.title === 'mine', JSON.stringify(readJson(DRAFT, null)));
}

// --- F2. The server's own wording survives; only the transport becomes the network text
{
  const CONNECTION = 'Could not reach the server. Check your connection and try again.';
  const rateLimit = 'For security purposes, you can only request this after 43 seconds.';

  check('a rate limit keeps the server wording', authFailureMessage(new Error(rateLimit)) === rateLimit, authFailureMessage(new Error(rateLimit)));
  check('an invalid email keeps the server wording', authFailureMessage(new Error('Email address "x" is invalid')) === 'Email address "x" is invalid');
  check('a failed fetch becomes the connection text', authFailureMessage(new TypeError('Failed to fetch')) === CONNECTION);
  check('a network error becomes the connection text', authFailureMessage(new Error('NetworkError when attempting to fetch resource.')) === CONNECTION);
  check('an unknown throw becomes the connection text', authFailureMessage(undefined) === CONNECTION);
  check('an empty error message becomes the connection text', authFailureMessage(new Error('')) === CONNECTION);
}

// --- F3. A wholesale refusal is reported, not silently read as "all stale" ----------
{
  const source = readFileSync(join(ROOT, 'src', 'services', 'supabase', 'adapter.ts'), 'utf8');
  check(
    'the adapter guards a non-empty push that accepted nothing',
    /rows\.length > 0 && accepted\.length === 0/.test(source),
    'rows.length > 0 && accepted.length === 0',
  );
  check('the guard throws a RemoteError naming the session', /throw new RemoteError\(\s*'The server refused every change/.test(source));
}

process.exit(report() === 0 ? 0 : 1);
