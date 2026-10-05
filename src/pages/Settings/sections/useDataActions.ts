import { useCallback, useRef, useState } from 'react';
import { toast } from '@/components/ui';
import { STORAGE_KEYS } from '@/constants';
import { deleteAllEntries, importBackupFile, replaceEntries } from '@/services';
import { countNewerLocalEntries } from '@/services/importService';
import { removeKey } from '@/lib/storage';
import { reportWrite, STORAGE_FULL } from '@/pages/Write/saveError';
import { useEntryStore, useSettingsStore } from '@/store';
import type { BackupPayload, Entry } from '@/types';

/** A parsed backup held back until the user confirms overwriting newer local entries. */
interface PendingImport {
  entries: Entry[];
  settings?: BackupPayload['settings'];
  message: string;
  newerCount: number;
}

/**
 * Import and clear behaviour for the Data section.
 *
 * Both paths report the write's actual result rather than an assumed one: storage can
 * refuse a write (quota, blocked origin), and telling the user their data was cleared or
 * imported when it was not sends them away from an intact diary.
 */
export function useDataActions() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [pending, setPending] = useState<PendingImport | null>(null);

  /** Applies a parsed backup, then reports the write result. */
  const apply = useCallback((result: PendingImport) => {
    // Merge against storage at write time: the file read is async, so a list captured from
    // an earlier render can drop entries added while the read was in flight.
    const current = useEntryStore.getState().entries;
    const importedIds = new Set(result.entries.map((entry) => entry.id));
    const merged: Entry[] = [...current.filter((entry) => !importedIds.has(entry.id)), ...result.entries];
    const saved = replaceEntries(merged);
    if (result.settings) useSettingsStore.getState().update(result.settings);
    reportWrite(saved, result.message, STORAGE_FULL);
  }, []);

  const handleImport = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      const result = await importBackupFile(file);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      // Import replaces the collection, so it is the one path that can move a local entry
      // backwards. Ask before overwriting anything newer than the file.
      const newerCount = countNewerLocalEntries(useEntryStore.getState().entries, result.entries);
      if (newerCount > 0) {
        setPending({ ...result, newerCount });
        return;
      }
      apply({ ...result, newerCount: 0 });
    },
    [apply],
  );

  const handleClear = useCallback(() => {
    const saved = deleteAllEntries();
    useEntryStore.getState().refresh();
    if (saved) removeKey(STORAGE_KEYS.draft);
    setConfirmClear(false);
    reportWrite(saved, 'All entries removed', STORAGE_FULL);
  }, []);

  const confirmPending = useCallback(() => {
    if (pending) apply(pending);
    setPending(null);
  }, [apply, pending]);

  return {
    fileRef,
    confirmClear,
    setConfirmClear,
    pending,
    cancelPending: () => setPending(null),
    confirmPending,
    handleImport,
    handleClear,
  } as const;
}
