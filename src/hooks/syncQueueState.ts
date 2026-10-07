/**
 * Queue helpers used by the sync lifecycle hook.
 *
 * These now re-export the canonical implementations in `@/services/sync`: `pendingCount`
 * and `hasPendingUpload` used to be reimplemented here as well, so a change to the queue's
 * shape had to be made in two places that could silently drift apart.
 *
 * `queueSignature` is the outbox signature — the queue's length alone is not enough to
 * detect a change, because editing one entry repeatedly keeps the queue at a single item
 * the whole time, so comparing counts saw "nothing new" and never scheduled the push.
 */
export { outboxSignature as queueSignature, pendingCount } from '@/services/sync/outbox';
export { hasPendingUpload } from '@/services/sync/owner';
