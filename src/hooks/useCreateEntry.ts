import { useCallback } from 'react';
import { useEntryStore } from '@/store';
import type { Entry, EntryDraft } from '@/types';

/** Returns a callback that creates an entry and refreshes the store. */
export function useCreateEntry() {
  const addEntry = useEntryStore((state) => state.addEntry);

  return useCallback(
    (draft: Partial<EntryDraft>): Entry => addEntry(draft),
    [addEntry],
  );
}
