import type { Entry } from '@/types';
import { listAllRecords, saveEntries } from '../entryQuery';
import { clearUploaded, enqueue } from './outbox';
import { nextStamp, observeStamps } from './clock';
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
 * The order is the whole safety argument: pull first, merge, write the merged collection
 * locally, and only then upload. Uploading before merging would push a local version the
 * merge is about to replace, and the other device would briefly see the older text.
 *
 * The local read happens *after* the awaited pull, not before. `await adapter.pull()` yields
 * for the whole round trip, and a write landing in that window is in neither the pre-await
 * snapshot nor the server's answer — writing the merge result back from a stale snapshot
 * deleted that entry outright. Re-reading costs one array copy and removes the window.
 *
 * The merge is deliberately total rather than incremental: it compares the whole collection
 * against the whole server state. For a personal diary — hundreds of entries, a few
 * kilobytes each — a full compare is simpler than per-entry revisions and cannot drift.
 * `ponytail:` full-collection sync; move to a per-entry cursor past tens of thousands.
 */
export async function syncNow(adapter: RemoteAdapter, account: Account): Promise<SyncReport> {
  let remote: Entry[];
  try {
    const result = await adapter.pull(account);
    remote = result.entries;
  } catch (error) {
    return { pulled: 0, pushed: 0, applied: false, error: describe(error) };
  }

  // Adopt the stamps seen remotely so this device's next write sorts after them, even when
  // the remote device's clock runs ahead of this one's.
  observeStamps(remote.map((entry) => entry.updatedAt));

  // Read after the pull, so anything written during the round trip joins the merge instead
  // of being overwritten by it.
  const local = listAllRecords();
  const { merged, toPush, changed, bumped, settled } = mergeEntries(local, remote, nextStamp);

  if (changed) saveEntries(merged);

  // A tie won locally is re-stamped past the shared stamp; queue that fresh stamp so a later
  // failed push is retried and so the clear below has the exact value to compare against.
  Object.entries(bumped).forEach(([id, stamp]) => enqueue(id, stamp));

  // Upload whatever this device won. The stamp recorded in the queue is the record's own
  // `updatedAt`, so the clear below can compare-and-delete against it.
  const byId = new Map(merged.map((entry) => [entry.id, entry]));
  const outgoing = toPush.map((id) => byId.get(id)).filter((entry): entry is Entry => entry !== undefined);

  let pushed = 0;
  if (outgoing.length > 0) {
    let accepted: string[] | void;
    try {
      accepted = await adapter.push(account, outgoing);
    } catch (error) {
      return { pulled: remote.length, pushed: 0, applied: changed, error: describe(error) };
    }
    // The server rejects a row whose stamp is not strictly newer. Keep a rejected id queued
    // (drop it from `settled`) so its change is retried rather than cleared un-uploaded.
    if (Array.isArray(accepted)) {
      const acceptedIds = new Set(accepted);
      outgoing.forEach((entry) => {
        if (!acceptedIds.has(entry.id)) delete settled[entry.id];
      });
    }
    pushed = outgoing.length;
  }

  // Settle exactly the stamps this merge accounted for. A write that landed after the merge
  // read — or during the push — holds a newer stamp, so compare-and-delete skips it and the
  // edit stays queued for the next pass instead of being stranded locally.
  clearUploaded(settled);

  return { pulled: remote.length, pushed, applied: changed };
}

/** Turns an unknown thrown value into something safe to show and to log. */
function describe(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Sync failed.';
}
