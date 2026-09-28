import { useCallback } from 'react';
import { useEntryStore } from '@/store';

/** Returns a callback that deletes an entry and refreshes the store. */
export function useDeleteEntry() {
  const removeEntry = useEntryStore((state) => state.removeEntry);

  return useCallback((id: string): void => removeEntry(id), [removeEntry]);
}
