import { DEFAULT_MOOD, LIMITS } from '@/constants';
import { createId } from '@/lib/id';
import { sanitizeTitle } from '@/lib/validate';
import type { Entry, EntryDraft, EntryUpdate } from '@/types';
import { byNewest, resolveTitle, withDerivedFields } from './entryFields';
import { listAllRecords, rememberDeleted, saveEntries, wasDeleted } from './entryQuery';

/**
 * Monotonic stamp source.
 *
 * `Date.now()` alone can hand two writes inside the same millisecond the same stamp, and
 * `updateEntry`'s guard compares stamps to tell one version of an entry from another: a
 * tie would make a stale write look current. Holding the last value keeps every stamp
 * strictly newer than the previous one.
 */
let lastStamp = 0;

function stamp(): string {
  const now = Math.max(Date.now(), lastStamp + 1);
  lastStamp = now;
  return new Date(now).toISOString();
}

/** Creates and stores a new entry, returning the stored record. Text is bounded to LIMITS like the read path. */
export function createEntry(draft: Partial<EntryDraft>): Entry {
  const now = stamp();
  const entry = withDerivedFields({
    id: createId(),
    title: sanitizeTitle(draft.title ?? ''),
    content: (draft.content ?? '').slice(0, LIMITS.contentMaxLength),
    mood: draft.mood ?? DEFAULT_MOOD,
    tags: draft.tags ?? [],
    date: draft.date ?? now,
    createdAt: now,
    updatedAt: now,
    isFavorite: draft.isFavorite ?? false,
    isPrivate: draft.isPrivate ?? false,
    location: draft.location?.slice(0, LIMITS.locationMaxLength),
    images: draft.images?.slice(0, LIMITS.maxImages),
    wordCount: 0,
    readingTime: 0,
  });
  saveEntries([entry, ...listAllRecords()]);
  return entry;
}
/** Applies a partial update. `expectedUpdatedAt` guards a second writer: the composer holds
 * the whole form from the moment it opened, so writing it over a record another tab has
 * since changed would revert that work. Text fields are bounded to LIMITS like createEntry. */
export function updateEntry(id: string, patch: EntryUpdate, expectedUpdatedAt?: string): Entry | null {
  const entries = listAllRecords();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
  if (expectedUpdatedAt !== undefined && entries[index].updatedAt !== expectedUpdatedAt) return null;
  const merged = withDerivedFields({
    ...entries[index],
    ...patch,
    title: resolveTitle(patch, entries[index].title),
    content: (patch.content ?? entries[index].content).slice(0, LIMITS.contentMaxLength),
    location: (patch.location ?? entries[index].location)?.slice(0, LIMITS.locationMaxLength),
    updatedAt: stamp(),
  });
  entries[index] = merged;
  saveEntries(entries);
  return merged;
}

/** Removes an entry from storage. */
export function deleteEntry(id: string): boolean {
  const entries = listAllRecords();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return false;
  entries.splice(index, 1);
  const saved = saveEntries(entries);
  if (saved) rememberDeleted([id]);
  return saved;
}

/** Empties the collection ("Clear all entries"). */
export function deleteAllEntries(): boolean {
  const removed = listAllRecords().map((entry) => entry.id);
  const saved = saveEntries([]);
  if (saved) rememberDeleted(removed);
  return saved;
}

/**
 * Replaces the whole collection, used by backup import. Entries the user deleted are
 * filtered out first: a backup written before the deletion still carries them, and
 * without this an import would silently bring every deletion back.
 */
export function replaceEntries(entries: Entry[]): boolean {
  return saveEntries(byNewest(entries.filter((entry) => !wasDeleted(entry.id)).map(withDerivedFields)));
}

/** Toggles the favorite flag on an entry. */
export function toggleFavorite(id: string): Entry | null {
  const records = listAllRecords();
  const entry = records.find((item) => item.id === id);
  if (!entry) return null;
  return updateEntry(id, { isFavorite: !entry.isFavorite }, entry.updatedAt);
}
