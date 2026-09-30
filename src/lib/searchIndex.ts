import { stripHtml } from '@/utils';
import type { Entry } from '@/types';

/**
 * Lowercased search text per entry, keyed on the entry object.
 *
 * Building it means stripping the markup from a whole body. Doing that for every entry
 * on every settled query cost more than the keystroke that triggered it — measured as an
 * 85 ms long task on a 400-entry diary. A `WeakMap` keyed on the object needs no
 * invalidation: editing an entry replaces its object, so the stale text is collected
 * with the old one.
 */
const cache = new WeakMap<Entry, string>();

/** Searchable text of one entry: title, body and tags, lowercased once. */
export function searchText(entry: Entry): string {
  const cached = cache.get(entry);
  if (cached !== undefined) return cached;
  const text = `${entry.title} ${stripHtml(entry.content)} ${entry.tags.join(' ')}`.toLowerCase();
  cache.set(entry, text);
  return text;
}
