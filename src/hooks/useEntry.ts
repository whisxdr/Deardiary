import { useEffect, useMemo } from 'react';
import { useEntryStore, useSettingsStore } from '@/store';
import type { Entry } from '@/types';

/**
 * Reads a single entry by id, reacting to store updates.
 *
 * Honours the "hide private entries" setting, so a deep link to a private entry shows
 * the same not-found state as the list would when the setting is on.
 */
export function useEntry(id: string | undefined): Entry | null {
  const entries = useEntryStore((state) => state.entries);
  const hydrated = useEntryStore((state) => state.hydrated);
  const hydrate = useEntryStore((state) => state.hydrate);
  const hidePrivate = useSettingsStore((state) => state.settings.privacy.hidePrivateEntries);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return useMemo(() => {
    if (!id) return null;
    const found = entries.find((entry) => entry.id === id) ?? null;
    if (found && hidePrivate && found.isPrivate) return null;
    return found;
  }, [entries, hidePrivate, id]);
}
