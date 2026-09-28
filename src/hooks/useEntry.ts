import { useEffect, useMemo } from 'react';
import { useEntryStore } from '@/store';
import type { Entry } from '@/types';

/** Reads a single entry by id, reacting to store updates. */
export function useEntry(id: string | undefined): Entry | null {
  const entries = useEntryStore((state) => state.entries);
  const hydrated = useEntryStore((state) => state.hydrated);
  const hydrate = useEntryStore((state) => state.hydrate);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return useMemo(() => {
    if (!id) return null;
    return entries.find((entry) => entry.id === id) ?? null;
  }, [entries, id]);
}
