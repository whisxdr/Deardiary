import { STORAGE_KEYS } from '@/constants';
import { readJson, writeJson } from '@/lib/storage';
import type { Entry } from '@/types';
import { byNewest, coerceEntry, looksLikeEntry, needsRepair } from './entryFields';

/** Reads all valid entries, including tombstones, and repairs old shapes. */
export function listAllRecords(): Entry[] {
  const stored = readJson<unknown>(STORAGE_KEYS.entries, []);
  if (!Array.isArray(stored)) return [];
  const records = stored.filter(looksLikeEntry) as Partial<Entry>[];
  const entries = byNewest(records.map(coerceEntry));
  if (records.length !== stored.length || records.some(needsRepair)) writeJson(STORAGE_KEYS.entries, entries);
  return entries;
}

/** Active entries only; tombstones remain stored for sync. */
export function listEntries(): Entry[] {
  return listAllRecords().filter((entry) => !entry.deletedAt);
}

/** Persists active entries and tombstones. */
export function saveEntries(entries: Entry[]): boolean {
  return writeJson(STORAGE_KEYS.entries, entries);
}

/** Finds one active entry by id. */
export function findEntry(id: string): Entry | null {
  return listEntries().find((entry) => entry.id === id) ?? null;
}

/** Every distinct tag in use, sorted alphabetically. */
export function listTags(): string[] {
  const tags = new Set<string>();
  listEntries().forEach((entry) => entry.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}
