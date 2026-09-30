import type { Entry } from '@/types';
import { listAllRecords, saveEntries } from '../entryQuery';
import { settle } from '../outbox';
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
 * older text. Nothing is written locally until the merge has decided a winner, so a pass
 * that fails halfway leaves the diary exactly as it was.
 *
 * The merge is deliberately total rather than incremental: it compares the whole
 * collection against the whole server state. For a personal diary — hundreds of entries,
 * a few kilobytes each — a full compare is simpler than tracking per-entry revisions and
 * cannot drift out of sync. `ponytail:` full-collection sync; switch to a per-entry
 * cursor if a diary ever holds tens of thousands of entries.
 */
export async function syncNow(adapter: RemoteAdapter, account: Account): Promise<SyncReport> {
  const local = listAllRecords();

  let remote: Entry[];
  try {
    const result = await adapter.pull(account);
    remote = result.entries;
  } catch (error) {
    return { pulled: 0, pushed: 0, applied: false, error: describe(error) };
  }

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
  } else {
    // Nothing to send, so anything queued is already on the server (or was superseded by
    // a newer remote version during the merge) and must not be retried forever.
    settle(local.map((entry) => entry.id));
  }

  return { pulled: remote.length, pushed, applied: changed };
}

/** Turns an unknown thrown value into something safe to show and to log. */
function describe(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Sync failed.';
}
