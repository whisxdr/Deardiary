import { STORAGE_KEYS } from '@/constants';
import { readJson, writeJson } from '@/lib/storage';
import type { Entry } from '@/types';

/** One entry id that changed locally and has not reached the server yet. */
export interface PendingChange {
  id: string;
  /** The entry's `updatedAt` at the moment it was queued. */
  updatedAt: string;
  /** Deletions are queued too, so a removal can travel instead of being re-downloaded. */
  deleted: boolean;
}

/**
 * The set of entries this device has changed but not yet uploaded.
 *
 * This is the seam the sync layer plugs into. It is deliberately not an async storage
 * layer: a local write has to stay synchronous, because the flush on `pagehide` runs when
 * the browser is tearing the page down and any `await` in that path is dropped. Recording
 * what changed is cheap and synchronous; uploading it happens later, on its own.
 *
 * Keyed by entry id so repeated edits collapse into one pending push, and the newest
 * stamp wins — the server only needs the latest state of each id, not every step.
 */
export function readOutbox(): PendingChange[] {
  const stored = readJson<unknown>(STORAGE_KEYS.outbox, []);
  if (!Array.isArray(stored)) return [];
  return stored.filter(
    (item): item is PendingChange =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as PendingChange).id === 'string' &&
      typeof (item as PendingChange).updatedAt === 'string' &&
      typeof (item as PendingChange).deleted === 'boolean',
  );
}

/** Writes the outbox back. */
export function writeOutbox(changes: PendingChange[]): boolean {
  return writeJson(STORAGE_KEYS.outbox, changes);
}

/** Queues one entry as needing an upload, collapsing an earlier change to the same id. */
export function enqueue(entry: Pick<Entry, 'id' | 'updatedAt' | 'deletedAt'>): void {
  const rest = readOutbox().filter((change) => change.id !== entry.id);
  writeOutbox([...rest, { id: entry.id, updatedAt: entry.updatedAt, deleted: entry.deletedAt !== undefined }]);
}

/** Drops ids that have been uploaded, leaving anything queued since the push started. */
export function settle(ids: string[]): void {
  if (ids.length === 0) return;
  const done = new Set(ids);
  writeOutbox(readOutbox().filter((change) => !done.has(change.id)));
}

/** How many entries are waiting to be uploaded. */
export function pendingCount(): number {
  return readOutbox().length;
}
