import { STORAGE_KEYS } from '@/constants';
import { readJson, writeJson } from '@/lib/storage';

/** Entry id -> the `updatedAt` at the moment the entry was queued. */
export type Outbox = Record<string, string>;

/**
 * The set of entries this device has changed but not yet uploaded.
 *
 * Deliberately not an async storage layer: a local write has to stay synchronous, because
 * the flush on `pagehide` runs while the browser tears the page down and any `await` in
 * that path is dropped. Recording what changed is cheap and synchronous; uploading it
 * happens later, on its own.
 *
 * Keyed by entry id, so repeated edits collapse into one pending push and only the latest
 * stamp survives — the server only needs the newest state of each id, not every step.
 */
export function readOutbox(): Outbox {
  const stored = readJson<unknown>(STORAGE_KEYS.outbox, {});
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};
  const pairs = Object.entries(stored as Record<string, unknown>).filter(
    (pair): pair is [string, string] => typeof pair[1] === 'string',
  );
  return Object.fromEntries(pairs);
}

/** Writes the outbox back. */
export function writeOutbox(outbox: Outbox): boolean {
  return writeJson(STORAGE_KEYS.outbox, outbox);
}

/** Queues one entry as needing an upload, replacing any earlier stamp for the same id. */
export function enqueue(id: string, updatedAt: string): void {
  writeOutbox({ ...readOutbox(), [id]: updatedAt });
}

/**
 * Drops ids that reached the server, by compare-and-delete on the exact stamp.
 *
 * The stamp check is what keeps a write that landed after the push started: the outbox
 * entry now holds a newer stamp than the one uploaded, so the delete is skipped and the
 * fresh edit stays queued instead of being stranded locally.
 */
export function clearUploaded(uploaded: Outbox): void {
  const current = readOutbox();
  let removed = false;
  Object.entries(uploaded).forEach(([id, stamp]) => {
    if (current[id] === stamp) {
      delete current[id];
      removed = true;
    }
  });
  if (removed) writeOutbox(current);
}

/** How many entries are waiting to be uploaded. */
export function pendingCount(): number {
  return Object.keys(readOutbox()).length;
}

/** `id:stamp` signature of the queue, for change detection without a deep compare. */
export function outboxSignature(): string {
  return Object.entries(readOutbox())
    .map(([id, stamp]) => `${id}:${stamp}`)
    .sort()
    .join('|');
}
