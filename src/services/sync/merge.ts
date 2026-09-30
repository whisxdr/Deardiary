import type { Entry } from '@/types';

/** Outcome of reconciling the local and remote copies of the collection. */
export interface MergeResult {
  /** The reconciled collection, ready to be written locally. */
  merged: Entry[];
  /** Ids whose local version should be uploaded. */
  toPush: string[];
  /** True when the merged collection differs from the local one. */
  changed: boolean;
}

/**
 * Decides which copy of an entry wins.
 *
 * The later `updatedAt` wins, which also makes a deletion win over an edit made before
 * it: `deleteEntry` stamps `updatedAt` alongside `deletedAt`, so a tombstone is simply a
 * newer version of the record. A tie keeps the local copy, because the local one is the
 * one the user is looking at.
 */
function preferred(local: Entry, remote: Entry): Entry {
  return new Date(remote.updatedAt).getTime() > new Date(local.updatedAt).getTime() ? remote : local;
}

/** True when two records carry the same content, so nothing needs writing. */
function same(a: Entry, b: Entry): boolean {
  return a.updatedAt === b.updatedAt && a.deletedAt === b.deletedAt && a.content === b.content && a.title === b.title;
}

/**
 * Reconciles the local collection against the server's.
 *
 * A union keyed on entry id, which is what makes the order of sign-in irrelevant: a
 * device that logs in first does not overwrite a device that logs in later. Every id
 * present on only one side is carried over, so neither a new local entry nor a new
 * remote one is lost, and a tombstone on either side removes the entry from both.
 *
 * Pure and synchronous on purpose: no storage, no network, so the rules can be tested
 * directly instead of only through a browser.
 */
export function mergeEntries(local: Entry[], remote: Entry[]): MergeResult {
  const localById = new Map(local.map((entry) => [entry.id, entry]));
  const remoteById = new Map(remote.map((entry) => [entry.id, entry]));
  const ids = new Set([...localById.keys(), ...remoteById.keys()]);

  const merged: Entry[] = [];
  const toPush: string[] = [];
  let changed = false;

  ids.forEach((id) => {
    const localCopy = localById.get(id);
    const remoteCopy = remoteById.get(id);

    if (localCopy && !remoteCopy) {
      merged.push(localCopy);
      toPush.push(id);
      return;
    }
    if (!localCopy && remoteCopy) {
      merged.push(remoteCopy);
      changed = true;
      return;
    }
    if (!localCopy || !remoteCopy) return;

    const winner = preferred(localCopy, remoteCopy);
    merged.push(winner);
    if (winner === remoteCopy) {
      if (!same(localCopy, remoteCopy)) changed = true;
      return;
    }
    // The local copy won. If the server's copy differs at all, this device has to push,
    // otherwise the other device keeps showing the older version forever.
    if (!same(localCopy, remoteCopy)) toPush.push(id);
  });

  return { merged, toPush, changed };
}
