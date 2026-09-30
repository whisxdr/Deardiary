import { DEFAULT_MOOD, LIMITS, STORAGE_KEYS } from '@/constants';
import { createId } from '@/lib/id';
import { readJson, writeJson } from '@/lib/storage';
import { sanitizeTitle } from '@/lib/validate';
import type { Entry, EntryDraft, EntryUpdate } from '@/types';
import { byNewest, coerceEntry, looksLikeEntry, needsRepair, resolveTitle, withDerivedFields } from './entryFields';

/**
 * Reads every entry from storage.
 *
 * Records that do not match the current shape are coerced and written back, so a
 * payload from an older build heals on first read instead of crashing a page that
 * assumes every field is present.
 */
export function listEntries(): Entry[] {
  const stored = readJson<unknown>(STORAGE_KEYS.entries, []);
  if (!Array.isArray(stored)) return [];

  const records = stored.filter(looksLikeEntry);
  if (records.length !== stored.length || records.some(needsRepair)) {
    const repaired = byNewest(records.map(coerceEntry));
    writeJson(STORAGE_KEYS.entries, repaired);
    return repaired;
  }
  return byNewest(records as Entry[]);
}

/** Persists the full entry collection. */
export function saveEntries(entries: Entry[]): boolean {
  return writeJson(STORAGE_KEYS.entries, entries);
}

/** Finds one entry by id. */
export function findEntry(id: string): Entry | null {
  return listEntries().find((entry) => entry.id === id) ?? null;
}

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
 * `expectedUpdatedAt` guards against a second tab: the composer holds the whole form from
 * the moment it opened, so writing it over a record another tab has since changed would
 * revert that tab's work. When the stored stamp does not match, nothing is written and
 * null comes back — the caller treats it the same as a missing entry, which is safe
 * because both mean "do not write this".
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

/** Replaces the whole collection, used by import and by the seed step. */
export function replaceEntries(entries: Entry[]): boolean {
  return saveEntries(byNewest(entries.map(withDerivedFields)));
}

/** Toggles the favorite flag on an entry. */
export function toggleFavorite(id: string): Entry | null {
  const entry = findEntry(id);
  if (!entry) return null;
  return updateEntry(id, { isFavorite: !entry.isFavorite });
}

/** Every distinct tag in use, sorted alphabetically. */
export function listTags(): string[] {
  const tags = new Set<string>();
  listEntries().forEach((entry) => entry.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}
