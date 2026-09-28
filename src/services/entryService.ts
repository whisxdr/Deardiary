import { DEFAULT_MOOD, LIMITS, STORAGE_KEYS } from '@/constants';
import { createId } from '@/lib/id';
import { readJson, writeJson } from '@/lib/storage';
import { sanitizeTitle } from '@/lib/validate';
import type { Entry, EntryDraft, EntryUpdate } from '@/types';
import { byNewest, resolveTitle, withDerivedFields } from './entryFields';

/** Reads every entry from storage. */
export function listEntries(): Entry[] {
  const stored = readJson<Entry[]>(STORAGE_KEYS.entries, []);
  return Array.isArray(stored) ? byNewest(stored) : [];
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

/** Applies a partial update to an entry and returns the updated record. */
export function updateEntry(id: string, patch: EntryUpdate): Entry | null {
  const entries = listEntries();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
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
