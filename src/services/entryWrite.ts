import { DEFAULT_MOOD, LIMITS } from '@/constants';
import { createId } from '@/lib/id';
import { sanitizeTitle } from '@/lib/validate';
import type { Entry, EntryDraft, EntryUpdate } from '@/types';
import { byNewest, resolveTitle, withDerivedFields } from './entryFields';
import { listAllRecords, saveEntries } from './entryQuery';
import { nextStamp } from './sync/clock';
import { enqueue } from './sync/outbox';

/** Creates and stores a new entry, returning the stored record. */
export function createEntry(draft: Partial<EntryDraft>): Entry {
  const now = nextStamp();
  const entry = withDerivedFields({
    id: createId(),
    title: sanitizeTitle(draft.title ?? ''),
    content: draft.content ?? '',
    mood: draft.mood ?? DEFAULT_MOOD,
    tags: draft.tags ?? [],
    date: draft.date ?? now,
    createdAt: now,
    updatedAt: now,
    isFavorite: draft.isFavorite ?? false,
    isPrivate: draft.isPrivate ?? false,
    location: draft.location,
    images: draft.images?.slice(0, LIMITS.maxImages),
    wordCount: 0,
    readingTime: 0,
  });
  saveEntries([entry, ...listAllRecords()]);
  enqueue(entry.id, entry.updatedAt);
  return entry;
}
/**
 * Applies a partial update and returns the updated record. `expectedUpdatedAt` guards a
 * second writer: the composer holds the whole form from the moment it opened, so writing it
 * over a record another tab or device has since changed would revert that work.
 */
export function updateEntry(id: string, patch: EntryUpdate, expectedUpdatedAt?: string): Entry | null {
  const entries = listAllRecords();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
  // A deleted entry stays deleted: editing it would resurrect a page the user removed.
  if (entries[index].deletedAt !== undefined) return null;
  if (expectedUpdatedAt !== undefined && entries[index].updatedAt !== expectedUpdatedAt) return null;
  const merged = withDerivedFields({
    ...entries[index],
    ...patch,
    title: resolveTitle(patch, entries[index].title),
    updatedAt: nextStamp(),
  });
  entries[index] = merged;
  saveEntries(entries);
  enqueue(merged.id, merged.updatedAt);
  return merged;
}

/**
 * Blanks the user-written fields so a deletion leaves no plaintext behind. The row keeps its
 * id and stamps so the tombstone can still merge and travel; only the words — body, title,
 * tags, location, images — are dropped.
 */
function scrub(entry: Entry): Entry {
  return { ...entry, title: '', content: '', tags: [], images: undefined, location: undefined };
}

/** Marks an entry deleted, keeping it as a scrubbed tombstone so the removal can travel. */
export function deleteEntry(id: string): boolean {
  const entries = listAllRecords();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1 || entries[index].deletedAt !== undefined) return false;
  const now = nextStamp();
  const tombstone = scrub({ ...entries[index], deletedAt: now, updatedAt: now });
  entries[index] = tombstone;
  const saved = saveEntries(entries);
  if (saved) enqueue(tombstone.id, tombstone.updatedAt);
  return saved;
}
/**
 * Marks every live entry deleted ("Clear all entries"), writing tombstones rather than an
 * empty array: an empty array erases the fact the entries existed, so the next sync would
 * download them all back from any device that still has them.
 */
export function deleteAllEntries(): boolean {
  const entries = listAllRecords();
  const now = nextStamp();
  const stamped = entries.map((entry) =>
    entry.deletedAt === undefined ? scrub({ ...entry, deletedAt: now, updatedAt: now }) : entry,
  );
  if (stamped.every((entry, index) => entry === entries[index])) return true;
  const saved = saveEntries(stamped);
  if (saved) stamped.filter((entry) => entry.deletedAt === now).forEach((entry) => enqueue(entry.id, entry.updatedAt));
  return saved;
}

/**
 * Replaces the whole collection, used by backup import and the sync apply step. A stored
 * tombstone is sync metadata, not user content, so an import must not erase it: a deletion
 * that lost its tombstone would be re-downloaded from another device. The tombstone is
 * dropped only when the import carries a record for the same id whose stamp is strictly
 * newer — an explicit restore of a deleted entry.
 */
export function replaceEntries(entries: Entry[]): boolean {
  const incoming = new Map(entries.map((entry) => [entry.id, entry]));
  listAllRecords().forEach((stored) => {
    if (stored.deletedAt === undefined) return;
    const fromImport = incoming.get(stored.id);
    const restored =
      fromImport !== undefined && new Date(fromImport.updatedAt).getTime() > new Date(stored.updatedAt).getTime();
    if (!restored) incoming.set(stored.id, stored);
  });
  return saveEntries(byNewest([...incoming.values()].map(withDerivedFields)));
}

/** Toggles the favorite flag on a live entry. */
export function toggleFavorite(id: string): Entry | null {
  const records = listAllRecords();
  const entry = records.find((item) => item.id === id);
  if (!entry || entry.deletedAt !== undefined) return null;
  return updateEntry(id, { isFavorite: !entry.isFavorite }, entry.updatedAt);
}
