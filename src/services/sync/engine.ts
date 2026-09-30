import type { Entry } from '@/types';
import { listAllRecords, saveEntries } from '../entryQuery';
import { readOutbox, settle } from '../outbox';
import { mergeEntries } from './merge';
import type { Account, RemoteAdapter } from './types';

/** What one sync pass did, for the UI and for the tests to assert on. */
export interface SyncReport {
  /** Entries downloaded from the server. */
  pulled: number;
  /** Entries uploaded to the server. */
  pushed: number;
  /** True when the local collection was rewritten. */
  applied: boolean;
  /** Set when the pass failed; the local diary is untouched in that case. */
  error?: string;
}

/**
 * Runs one reconciliation pass.
 *
 * The order matters and is the whole safety argument: pull first, merge, write the merged
 * collection locally, and only then upload. Uploading before merging would push a local
 * version that the merge is about to replace, and the other device would briefly see the
 * older text.
 *
 * The merge input is re-read *after* the network call, not before. `await adapter.pull()`
 * yields for the whole round trip, and a write landing in that window is in neither the
 * pre-await snapshot nor the server's answer — writing the merge result back from a stale
 * snapshot deleted that entry outright. Re-reading costs one array copy and removes the
 * window entirely.
 *
 * The merge is deliberately total rather than incremental: it compares the whole
 * collection against the whole server state. For a personal diary — hundreds of entries,
 * a few kilobytes each — a full compare is simpler than tracking per-entry revisions and
 * cannot drift out of sync. `ponytail:` full-collection sync; switch to a per-entry
 * cursor if a diary ever holds tens of thousands of entries.
 */
export async function syncNow(adapter: RemoteAdapter, account: Account): Promise<SyncReport> {
  let remote: Entry[];
  try {
    const result = await adapter.pull(account);
    remote = result.entries;
  } catch (error) {
    return { pulled: 0, pushed: 0, applied: false, error: describe(error) };
  }

  // Read after the pull, so anything written during the round trip is part of the merge
  // instead of being overwritten by it.
  const local = listAllRecords();
  const { merged, toPush, changed } = mergeEntries(local, remote);

  if (changed) saveEntries(merged);

  // Upload whatever this device won, plus anything the merge could not settle locally.
  const byId = new Map(merged.map((entry) => [entry.id, entry]));
  const outgoing = toPush.map((id) => byId.get(id)).filter((entry): entry is Entry => entry !== undefined);

  let pushed = 0;
  if (outgoing.length > 0) {
    try {
      await adapter.push(account, outgoing);
      pushed = outgoing.length;
      // Only now is it safe to forget the queued changes: a push that threw leaves the
      // outbox intact so the next pass retries instead of dropping the edit.
      settle(outgoing.map((entry) => entry.id));
    } catch (error) {
      return { pulled: remote.length, pushed: 0, applied: changed, error: describe(error) };
    }
  }

  /**
   * Clear the queue only for ids this pass actually accounted for.
   *
   * Settling every local id would also clear an entry queued by a write that landed after
   * the merge read — that change was never uploaded, so forgetting it would strand it
   * locally forever while the other device never saw it.
   */
  const accounted = new Set(merged.map((entry) => entry.id));
  settle(readOutbox().filter((change) => accounted.has(change.id)).map((change) => change.id));

  return { pulled: remote.length, pushed, applied: changed };
}

/** Turns an unknown thrown value into something safe to show and to log. */
function describe(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Sync failed.';
}
