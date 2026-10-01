import { useEffect } from 'react';
import { toast } from '@/components/ui';
import { useEntryStore } from '@/store';

/**
 * Says so when a change did not reach storage.
 *
 * `writeFailed` was computed on every mutation and read by nothing, so a full or blocked
 * localStorage produced a silent failure: the star filled in, the toast said "Entry
 * published", and a reload showed the old state. This turns that into one message the
 * user actually sees.
 *
 * Mounted once, in the providers, so every page is covered rather than the one page
 * somebody remembered to wire.
 */
export function useStorageWarning(): void {
  const writeFailed = useEntryStore((state) => state.writeFailed);

  useEffect(() => {
    if (!writeFailed) return;
    toast.error('This browser refused to save. Your entries are kept in memory only and will be lost when the page closes. Export a backup now.');
  }, [writeFailed]);
}
