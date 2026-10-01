import type { Entry } from '@/types';

/** Outcome of reconciling the local and remote copies of the collection. */
export interface MergeResult {
  /** The reconciled collection, ready to be written locally. */
  merged: Entry[];
  /** Ids whose local version should be uploaded. */
  toPush: string[];
  /** True when the merged collection differs from the local one. */
  changed: boolean;
  /** id -> fresh stamp minted for a local winner bumped past a tie. Enqueue these. */
  bumped: Record<string, string>;
  /** id -> exact stamp to compare-and-delete from the outbox once the merge is applied. */
  settled: Record<string, string>;
}

/**
 * Every user-visible field of a record, as one comparable string. The whole record is
 * compared, not just the body: with only the body checked, a difference in mood, tags,
 * favourite, private, location, images or date on an equal stamp went unnoticed, the merge
 * kept the local copy, pushed nothing, and the server kept the other version forever. The
 * field order is fixed, so two devices break a tie the same way.
 */
function key(entry: Entry): string {
  return [
    entry.updatedAt, entry.deletedAt ?? '', entry.title, entry.content, entry.mood, entry.date,
    entry.isFavorite ? '1' : '0', entry.isPrivate ? '1' : '0', entry.location ?? '',
    entry.tags.join('\u0000'), (entry.images ?? []).join('\u0000'),
  ].join('\u0001');
}

/** True when two records are the same version of an entry. */
function same(a: Entry, b: Entry): boolean {
  return key(a) === key(b);
}

/**
 * Decides which copy of an entry wins. The later `updatedAt` wins, which also makes a
 * deletion beat an earlier edit (the write path stamps `updatedAt` with `deletedAt`). An
 * exact tie is broken by the whole record, not by "local wins": two devices can stamp the
 * same millisecond, and if each kept its own copy both would re-push and one would lose.
 */
function preferred(local: Entry, remote: Entry): Entry {
  const localAt = new Date(local.updatedAt).getTime();
  const remoteAt = new Date(remote.updatedAt).getTime();
  if (remoteAt !== localAt) return remoteAt > localAt ? remote : local;
  return key(local) >= key(remote) ? local : remote;
}

/**
 * Reconciles the local collection against the server's. A union keyed on entry id, which
 * makes the order of sign-in irrelevant: every id on only one side is carried over, so
 * neither a new local nor a new remote entry is lost, and a tombstone on either side removes
 * the entry from both. `stampAfter` mints the next logical stamp: a tie won locally but with
 * differing records is re-stamped past the shared stamp before it is pushed, since its push
 * would otherwise carry the server's own stamp and could not win. Both devices reach the
 * same content from the tiebreak, so only the winner re-stamps and the result converges.
 */
export function mergeEntries(local: Entry[], remote: Entry[], stampAfter?: () => string): MergeResult {
  const localById = new Map(local.map((entry) => [entry.id, entry]));
  const remoteById = new Map(remote.map((entry) => [entry.id, entry]));
  const ids = new Set([...localById.keys(), ...remoteById.keys()]);
  const merged: Entry[] = [];
  const toPush: string[] = [];
  const bumped: Record<string, string> = {};
  const settled: Record<string, string> = {};
  let changed = false;

  ids.forEach((id) => {
    const localCopy = localById.get(id);
    const remoteCopy = remoteById.get(id);

    if (localCopy && !remoteCopy) {
      merged.push(localCopy);
      toPush.push(id);
      settled[id] = localCopy.updatedAt;
      return;
    }
    if (!localCopy && remoteCopy) {
      merged.push(remoteCopy);
      settled[id] = remoteCopy.updatedAt;
      changed = true;
      return;
    }
    if (!localCopy || !remoteCopy) return;

    if (preferred(localCopy, remoteCopy) === remoteCopy) {
      // Settle the exact stamp the local copy was queued under, so a write that landed after
      // the merge read holds a newer stamp and stays queued for the next pass.
      merged.push(remoteCopy);
      settled[id] = localCopy.updatedAt;
      if (!same(localCopy, remoteCopy)) changed = true;
      return;
    }
    if (same(localCopy, remoteCopy)) {
      merged.push(localCopy);
      settled[id] = localCopy.updatedAt;
      return;
    }

    const tied = new Date(localCopy.updatedAt).getTime() === new Date(remoteCopy.updatedAt).getTime();
    if (tied && stampAfter) {
      const stamp = stampAfter();
      bumped[id] = stamp;
      merged.push({ ...localCopy, updatedAt: stamp });
      toPush.push(id);
      settled[id] = stamp;
      changed = true;
      return;
    }

    // The local copy won. It has to be pushed, or the other device keeps the older version.
    merged.push(localCopy);
    toPush.push(id);
    settled[id] = localCopy.updatedAt;
  });

  return { merged, toPush, changed, bumped, settled };
}
