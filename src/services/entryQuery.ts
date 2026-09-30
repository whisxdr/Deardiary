import { STORAGE_KEYS } from '@/constants';
import { readJson, writeJson } from '@/lib/storage';
import type { Entry } from '@/types';
import { byNewest, coerceEntry, looksLikeEntry, needsRepair } from './entryFields';

/**
 * Reads every stored record, tombstones included, repairing old shapes on the way.
 *
 * The repair is written back, so a payload from an older build heals on first read
 * instead of crashing a page that assumes every field is present. Repair keeps the id
 * deterministic, so two devices healing the same record produce the same entry.
 */
export function listAllRecords(): Entry[] {
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

/**
 * Reads the entries a user should see.
 *
 * Deleted entries are kept as tombstones so a deletion can travel to other devices, and
 * filtered out here so no page has to know they exist.
 */
export function listEntries(): Entry[] {
  return listAllRecords().filter((entry) => entry.deletedAt === undefined);
}

/** Persists the full record collection, tombstones included. */
export function saveEntries(entries: Entry[]): boolean {
  return writeJson(STORAGE_KEYS.entries, entries);
}

/** Finds one live entry by id. */
export function findEntry(id: string): Entry | null {
  return listEntries().find((entry) => entry.id === id) ?? null;
}

/** Every distinct tag in use, sorted alphabetically. */
export function listTags(): string[] {
  const tags = new Set<string>();
  listEntries().forEach((entry) => entry.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}
