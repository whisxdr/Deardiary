import { useEffect, useMemo } from 'react';
import { useEntryStore, useSettingsStore } from '@/store';
import type { Entry } from '@/types';

/**
 * Hydrates the entry store on mount and returns the entry collection.
 *
 * When "hide private entries" is on, private entries are filtered out here rather than
 * in each page, so the dashboard, stats, calendar and the reader's next/previous
 * navigation all agree on what is visible.
 */
export function useEntries() {
  const entries = useEntryStore((state) => state.entries);
  const hydrated = useEntryStore((state) => state.hydrated);
  const hydrate = useEntryStore((state) => state.hydrate);
  const hidePrivate = useSettingsStore((state) => state.settings.privacy.hidePrivateEntries);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const visible = useMemo<Entry[]>(
    () => (hidePrivate ? entries.filter((entry) => !entry.isPrivate) : entries),
    [entries, hidePrivate],
  );

  return { entries: visible, hydrated, hiddenCount: entries.length - visible.length } as const;
}
