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
 * newer version of the record.
 *
 * An exact tie is broken by content, not by "local wins". Two devices can stamp the same
 * millisecond, and the server rejects a push whose stamp is not strictly newer — so if
 * each device kept its own copy on a tie, both would re-push, both would be rejected, and
 * they would disagree forever. Comparing content gives both devices the same answer, so
 * they converge on one version instead of deadlocking.
 */
function preferred(local: Entry, remote: Entry): Entry {
  const localAt = new Date(local.updatedAt).getTime();
  const remoteAt = new Date(remote.updatedAt).getTime();
  if (remoteAt !== localAt) return remoteAt > localAt ? remote : local;
  return pickByContent(local, remote);
}

/** Deterministic tiebreak: both sides compute the same winner from the same inputs. */
function pickByContent(local: Entry, remote: Entry): Entry {
  const localKey = `${local.content}\u0000${local.title}`;
  const remoteKey = `${remote.content}\u0000${remote.title}`;
  if (localKey === remoteKey) return local;
  return remoteKey > localKey ? remote : local;
}

/**
 * True when two records are the same version of an entry.
 *
 * Compares every user-visible field, not just the stamp. With only `updatedAt` and the
 * body checked, a difference in mood, tags, favorite, private, location or images went
 * unnoticed on a tie: the merge kept the local copy, pushed nothing, and the server kept
 * the other version forever. Only a later content edit healed it.
 */
function same(a: Entry, b: Entry): boolean {
  return (
    a.updatedAt === b.updatedAt &&
    a.deletedAt === b.deletedAt &&
    a.title === b.title &&
    a.content === b.content &&
    a.mood === b.mood &&
    a.date === b.date &&
    a.isFavorite === b.isFavorite &&
    a.isPrivate === b.isPrivate &&
    a.location === b.location &&
    a.tags.join('\u0000') === b.tags.join('\u0000') &&
    (a.images ?? []).join('\u0000') === (b.images ?? []).join('\u0000')
  );
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
