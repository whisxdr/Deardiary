import { useEffect } from 'react';
import { useEntryStore } from '@/store';

/** Hydrates the entry store on mount and returns the entry collection. */
export function useEntries() {
  const entries = useEntryStore((state) => state.entries);
  const hydrated = useEntryStore((state) => state.hydrated);
  const hydrate = useEntryStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return { entries, hydrated };
}
