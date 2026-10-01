import { STORAGE_KEYS } from '@/constants';
import { readJson, writeJson } from '@/lib/storage';
import type { Entry } from '@/types';
import { byNewest, coerceEntry, looksLikeEntry, needsRepair } from './entryFields';

/**
 * A stored record that may still carry a `deletedAt` stamp.
 *
 * The stamp belongs to the removed sync feature, so it is not part of `Entry` any more.
 * Reading it as an unknown field is what lets a leftover tombstone be recognised and
 * dropped instead of being treated as a live entry.
 */
type StoredRecord = Partial<Entry> & { deletedAt?: unknown };

/** True when the record is a leftover tombstone from the removed sync feature. */
function isTombstone(record: StoredRecord): boolean {
  return typeof record.deletedAt === 'string';
}

/**
 * Reads the stored entries, repairing old shapes on the way.
 *
 * Tombstones are dropped here rather than carried. A record with `deletedAt` is a
 * leftover from the removed sync feature, where a deletion had to be recorded so it could
 * travel to another device. Without sync there is nothing to tell, and keeping the record
 * would leave a deleted entry sitting in storage forever.
 *
 * The repair is written back, so a payload from an older build heals on first read
 * instead of crashing a page that assumes every field is present.
 */
export function listEntries(): Entry[] {
  const stored = readJson<unknown>(STORAGE_KEYS.entries, []);
  if (!Array.isArray(stored)) return [];

  const records = stored.filter(looksLikeEntry) as StoredRecord[];
  const live = records.filter((record) => !isTombstone(record));
  const dropped = live.length !== stored.length;

  if (dropped || live.some(needsRepair)) {
    const repaired = byNewest(live.map(coerceEntry));
    writeJson(STORAGE_KEYS.entries, repaired);
    return repaired;
  }
  return byNewest(live as Entry[]);
}

/** Persists the entry collection. */
export function saveEntries(entries: Entry[]): boolean {
  return writeJson(STORAGE_KEYS.entries, entries);
}

/** Finds one entry by id. */
export function findEntry(id: string): Entry | null {
  return listEntries().find((entry) => entry.id === id) ?? null;
}

/** Every distinct tag in use, sorted alphabetically. */
export function listTags(): string[] {
  const tags = new Set<string>();
  listEntries().forEach((entry) => entry.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}
