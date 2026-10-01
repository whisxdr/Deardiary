import { DEFAULT_MOOD, LIMITS } from '@/constants';
import { createId } from '@/lib/id';
import { sanitizeTitle } from '@/lib/validate';
import type { Entry, EntryDraft, EntryUpdate } from '@/types';
import { byNewest, resolveTitle, withDerivedFields } from './entryFields';
import { listEntries, saveEntries } from './entryQuery';

/** Creates and stores a new entry, returning the stored record. */
export function createEntry(draft: Partial<EntryDraft>): Entry {
  const now = new Date().toISOString();
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
  saveEntries([entry, ...listEntries()]);
  return entry;
}

/**
 * Applies a partial update to an entry and returns the updated record.
 *
 * `expectedUpdatedAt` guards against a second writer: the composer holds the whole form
 * from the moment it opened, so writing it over a record another tab has since changed
 * would revert that work. When the stored stamp does not match, nothing is written and
 * null comes back, which the caller treats the same as a missing entry because both mean
 * "do not write this".
 */
export function updateEntry(id: string, patch: EntryUpdate, expectedUpdatedAt?: string): Entry | null {
  const entries = listEntries();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
  if (expectedUpdatedAt !== undefined && entries[index].updatedAt !== expectedUpdatedAt) return null;
  const merged = withDerivedFields({
    ...entries[index],
    ...patch,
    title: resolveTitle(patch, entries[index].title),
    updatedAt: new Date().toISOString(),
  });
  entries[index] = merged;
  saveEntries(entries);
  return merged;
}

/** Removes an entry by id. */
export function deleteEntry(id: string): boolean {
  const entries = listEntries();
  const next = entries.filter((entry) => entry.id !== id);
  if (next.length === entries.length) return false;
  return saveEntries(next);
}

/** Removes every entry. */
export function deleteAllEntries(): boolean {
  return saveEntries([]);
}

/** Replaces the whole collection, used by backup import. */
export function replaceEntries(entries: Entry[]): boolean {
  return saveEntries(byNewest(entries.map(withDerivedFields)));
}

/** Toggles the favorite flag on an entry. */
export function toggleFavorite(id: string): Entry | null {
  const entries = listEntries();
  const entry = entries.find((item) => item.id === id);
  if (!entry) return null;
  return updateEntry(id, { isFavorite: !entry.isFavorite }, entry.updatedAt);
}
