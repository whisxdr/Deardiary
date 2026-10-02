import { STORAGE_KEYS } from '@/constants';
import { isPersistent, lastWriteFailed, readJson, writeJson } from '@/lib/storage';
import type { Entry } from '@/types';
import { byNewest, coerceEntry, looksLikeEntry, needsRepair } from './entryFields';

/**
 * The last coerced collection, keyed on the exact raw text it was built from.
 *
 * A read used to re-coerce every record, and `coerceEntry` runs DOMPurify plus a word-count
 * regex per record: one favorite toggle on a 400-entry diary blocked the main thread for
 * ~1.3 s. Serving the same objects while the stored text is unchanged also keeps
 * `memo(EntryCard)` and the `searchText` WeakMap alive across a write, both of which a
 * fresh object graph on every read silently invalidated.
 *
 * `ponytail:` the whole collection is held in memory next to its raw text; move to a
 * per-record cache if a collection ever outgrows one tab's heap.
 */
let cache: { raw: string; records: Entry[]; live: Entry[]; coerced: Set<Entry> } | null = null;

/**
 * The raw stored text, or null when it is not the authoritative copy.
 *
 * Null when localStorage is unavailable or the last write to this key only reached the
 * in-memory fallback: that copy is then newer, and trusting the stored string would hide
 * the user's most recent change.
 */
function readRaw(): string | null {
  if (!isPersistent() || lastWriteFailed(STORAGE_KEYS.entries)) return null;
  try {
    return window.localStorage.getItem(STORAGE_KEYS.entries);
  } catch {
    return null;
  }
}

/**
 * Caches a coerced collection under the raw text now on disk.
 *
 * The raw text is re-read rather than passed in: the repair path above writes a new text,
 * and caching under the text that was read would leave the very next read a miss.
 */
function remember(records: Entry[]): void {
  const raw = readRaw();
  cache =
    raw === null
      ? null
      : { raw, records, live: records.filter((entry) => !entry.deletedAt), coerced: new Set(records) };
}

/** Reads all valid entries, including tombstones, and repairs old shapes. */
export function listAllRecords(): Entry[] {
  const raw = readRaw();
  if (raw !== null && cache !== null && cache.raw === raw) return cache.records;

  const stored = readJson<unknown>(STORAGE_KEYS.entries, []);
  if (!Array.isArray(stored)) return [];
  const records = stored.filter(looksLikeEntry) as Partial<Entry>[];
  const entries = byNewest(records.map(coerceEntry));
  if (records.length !== stored.length || records.some(needsRepair)) writeJson(STORAGE_KEYS.entries, entries);
  remember(entries);
  return entries;
}

/** Active entries only; tombstones remain stored for sync. */
export function listEntries(): Entry[] {
  const records = listAllRecords();
  if (cache !== null && cache.records === records) return cache.live;
  return records.filter((entry) => !entry.deletedAt);
}

/**
 * Persists active entries and tombstones, priming the read cache with the written objects.
 *
 * A written record that is already in the cache is kept as-is, so the objects the store
 * holds stay identical across a write and `memo(EntryCard)` can skip. Anything else — a
 * new or edited record — is coerced here instead of on the next read: the same pass the
 * reader would have paid, for only the records that actually changed.
 */
export function saveEntries(entries: Entry[]): boolean {
  const known = cache?.coerced;
  const written = entries.map((entry) => (known?.has(entry) ? entry : coerceEntry(entry)));
  const ok = writeJson(STORAGE_KEYS.entries, written);
  if (ok) remember(written);
  else cache = null;
  return ok;
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
