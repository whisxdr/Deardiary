import { useCallback, useMemo, useState } from 'react';
import { parseDate } from '@/utils';
import { searchText } from '@/lib/searchIndex';
import type { Entry, EntryFilters, SortOrder } from '@/types';

/** Default filter state shared by the dashboard toolbar and the search hook. */
export const DEFAULT_FILTERS: EntryFilters = {
  query: '',
  mood: 'all',
  tag: 'all',
  favoritesOnly: false,
  dateFrom: '',
  dateTo: '',
  sort: 'newest',
};

/** Sorts entries according to the selected order. */
function sortEntries(entries: Entry[], sort: string): Entry[] {
  const order = sort as SortOrder;
  // Parse each date once: `new Date` in the comparator ran twice per comparison.
  if (order === 'oldest' || order === 'newest') {
    const timed = entries.map((entry) => ({ entry, time: parseDate(entry.date).getTime() }));
    timed.sort((a, b) => (order === 'oldest' ? a.time - b.time : b.time - a.time));
    return timed.map((item) => item.entry);
  }
  const list = [...entries];
  switch (order) {
    case 'title':
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    case 'mood':
      return list.sort((a, b) => a.mood.localeCompare(b.mood));
    default:
      return list.sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
  }
}

/** Filters and sorts an entry collection, with a reset helper for the toolbar. */
export function useFilter(source: Entry[], initial: Partial<EntryFilters> = {}) {
  const [filters, setFilters] = useState<EntryFilters>({ ...DEFAULT_FILTERS, ...initial });

  const update = useCallback((patch: Partial<EntryFilters>) => setFilters((current) => ({ ...current, ...patch })), []);

  /**
   * Clears every filter, including any that arrived from the URL.
   *
   * Resetting to the seeded `initial` state would restore the URL's tag and leave the
   * grid filtered, which reads as a broken button: the toolbar showed "All tags" while
   * one tag was still applied.
   */
  const reset = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const filtered = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    const from = filters.dateFrom ? parseDate(filters.dateFrom).getTime() : null;
    const to = filters.dateTo ? parseDate(filters.dateTo).getTime() : null;

    const result = source.filter((entry) => {
      if (filters.mood !== 'all' && entry.mood !== filters.mood) return false;
      if (filters.tag !== 'all' && !entry.tags.includes(filters.tag)) return false;
      if (filters.favoritesOnly && !entry.isFavorite) return false;
      const time = parseDate(entry.date).getTime();
      // A bad stored date yields NaN, and every NaN comparison is false, so a range
      // filter would silently pass it instead of excluding it.
      if (from !== null && !(time >= from)) return false;
      if (to !== null && !(time <= to + 86_399_000)) return false;
      if (query && !searchText(entry).includes(query)) return false;
      return true;
    });

    return sortEntries(result, filters.sort);
  }, [filters, source]);

  return { filters, update, reset, filtered } as const;
}
