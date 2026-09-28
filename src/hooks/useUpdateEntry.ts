import { useCallback } from 'react';
import { useEntryStore } from '@/store';
import type { Entry, EntryUpdate } from '@/types';

/** Returns a callback that patches an entry and refreshes the store. */
export function useUpdateEntry() {
  const patchEntry = useEntryStore((state) => state.patchEntry);

  return useCallback(
    (id: string, patch: EntryUpdate): Entry | null => patchEntry(id, patch),
    [patchEntry],
  );
}
