import { useCallback, useMemo, useState } from 'react';
import { stripHtml } from '@/utils';
import { useDebounce } from './useDebounce';
import type { Entry } from '@/types';

/** Debounced full-text search over titles, bodies and tags. */
export function useSearch(source: Entry[], delay = 300) {
  const [term, setTerm] = useState('');
  const debouncedTerm = useDebounce(term, delay);

  const results = useMemo(() => {
    const query = debouncedTerm.trim().toLowerCase();
    if (!query) return source;
    return source.filter((entry) => {
      const haystack = `${entry.title} ${stripHtml(entry.content)} ${entry.tags.join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [debouncedTerm, source]);

  const reset = useCallback(() => setTerm(''), []);

  return { term, setTerm, debouncedTerm, results, reset, isSearching: term !== debouncedTerm } as const;
}
