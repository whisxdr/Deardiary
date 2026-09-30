import { DEFAULT_MOOD, LIMITS } from '@/constants';
import { createId } from '@/lib/id';
import { sanitizeTitle } from '@/lib/validate';
import type { Entry, EntryDraft, EntryUpdate } from '@/types';
import { byNewest, resolveTitle, withDerivedFields } from './entryFields';
import { nextStamp } from './entryStamp';
import { listAllRecords, saveEntries } from './entryQuery';
import { enqueue } from './outbox';

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
  enqueue(entry);
  return entry;
}

/**
 * Applies a partial update to an entry and returns the updated record.
 *
 * `expectedUpdatedAt` guards against a second writer: the composer holds the whole form
 * from the moment it opened, so writing it over a record another tab — or another device,
 * once sync exists — has since changed would revert that work. When the stored stamp does
 * not match, nothing is written and null comes back, which the caller treats the same as
 * a missing entry because both mean "do not write this".
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
  enqueue(merged);
  return merged;
}

/**
 * Marks an entry deleted.
 *
 * The record is kept with a `deletedAt` stamp rather than dropped from the array. A
 * removed record is indistinguishable from one that was never uploaded, so the deletion
 * could not travel and the entry reappeared on the next sync.
 */
export function deleteEntry(id: string): boolean {
  const entries = listAllRecords();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1 || entries[index].deletedAt !== undefined) return false;
  const now = nextStamp();
  const tombstone = { ...entries[index], deletedAt: now, updatedAt: now };
  entries[index] = tombstone;
  const saved = saveEntries(entries);
  if (saved) enqueue(tombstone);
  return saved;
}

/**
 * Marks every live entry deleted.
 *
 * Used by "Clear all entries". It writes tombstones rather than an empty array: an empty
 * array erases the fact that the entries existed, so the next sync would download them
 * all back from any device that still has them.
 */
export function deleteAllEntries(): boolean {
  const now = nextStamp();
  const entries = listAllRecords();
  const stamped = entries.map((entry) =>
    entry.deletedAt === undefined ? { ...entry, deletedAt: now, updatedAt: now } : entry,
  );
  if (stamped.every((entry, index) => entry === entries[index])) return true;
  const saved = saveEntries(stamped);
  if (saved) stamped.filter((entry) => entry.deletedAt === now).forEach(enqueue);
  return saved;
}

/** Replaces the whole collection, used by import and by the sync apply step. */
export function replaceEntries(entries: Entry[]): boolean {
  return saveEntries(byNewest(entries.map(withDerivedFields)));
}

/** Toggles the favorite flag on a live entry. */
export function toggleFavorite(id: string): Entry | null {
  const records = listAllRecords();
  const entry = records.find((item) => item.id === id);
  if (!entry || entry.deletedAt !== undefined) return null;
  return updateEntry(id, { isFavorite: !entry.isFavorite }, entry.updatedAt);
}
