import { STORAGE_KEYS } from '@/constants';
import { readJson, removeKey, writeJson } from '@/lib/storage';
import { saveEntries } from '../entryQuery';
import { readOutbox, writeOutbox } from './outbox';

/** The account id the local entries belong to, or null when none ever signed in. */
export function readOwner(): string | null {
  const stored = readJson<unknown>(STORAGE_KEYS.owner, null);
  return typeof stored === 'string' && stored ? stored : null;
}

/**
 * Drops the local collection and the upload queue.
 *
 * The single implementation of "this device no longer holds the signed-in account's
 * diary", used when a different account signs in. Writing an empty collection drops the
 * tombstones too: they belong to the previous owner and must not travel to the new one.
 *
 * The draft goes with them: it is unfinished text by the previous owner, and leaving it
 * behind offered the new account "Continue Writing" over someone else's private words.
 * Settings are deliberately kept — displayName, bio and avatar are this device's
 * preferences, not another account's content, and clearing them would change behaviour
 * that was never asked for.
 */
export function clearLocalEntries(): void {
  saveEntries([]);
  writeOutbox({});
  removeKey(STORAGE_KEYS.draft);
}

/** True when the given account owns nothing here yet, so local entries must be dropped. */
export function isForeignAccount(accountId: string): boolean {
  const owner = readOwner();
  return owner !== null && owner !== accountId;
}

/**
 * Claims this device for an account, clearing first when a different account owned it.
 *
 * The guard is "a different account already owned this device", not "there are entries
 * here". A missing owner key means no account has ever signed in, so the entries are the
 * ones this person wrote offline and adopting them is the whole point of signing in;
 * clearing on a missing key instead destroyed the diary of every user who wrote first and
 * made an account second.
 *
 * Sign-out deliberately keeps the owner key for the same reason: it is what makes the next
 * sign-in detect that the entries belong to someone else. Foreign records are never queued
 * for upload — the queue is cleared with the entries rather than left to push them.
 */
export function claimDevice(accountId: string): void {
  if (isForeignAccount(accountId)) clearLocalEntries();
  writeJson(STORAGE_KEYS.owner, accountId);
}

/** True when the queue holds anything at all. */
export function hasPendingUpload(): boolean {
  return Object.keys(readOutbox()).length > 0;
}
