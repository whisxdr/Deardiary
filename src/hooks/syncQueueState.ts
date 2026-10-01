import { outboxSignature, readOutbox } from '@/services/sync/outbox';

/**
 * Signature of the upload queue: which entries are waiting, and at which revision.
 *
 * The length alone is not enough to detect a change. Editing one entry repeatedly keeps
 * the queue at a single item the whole time, so comparing counts saw "nothing new" and
 * never scheduled the push — the entry stayed on the device that wrote it.
 */
export function queueSignature(): string {
  return outboxSignature();
}

/** How many entries are waiting to upload. */
export function pendingCount(): number {
  return Object.keys(readOutbox()).length;
}

/**
 * True when the queue holds anything at all.
 *
 * Separate from the signature because a queue that is non-empty when the app mounts is
 * owed an upload immediately: the user may have written on the composer and navigated,
 * or closed the tab while offline, and neither produces a change this hook can observe.
 */
export function hasPendingUpload(): boolean {
  return pendingCount() > 0;
}
