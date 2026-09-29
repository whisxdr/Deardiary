import { useRef, useState } from 'react';
import { Button, toast } from '@/components/ui';
import { ConfirmDialog } from '@/components/common';
import { STORAGE_KEYS } from '@/constants';
import { exportBackup, importBackupFile } from '@/services';
import { estimateUsage, isPersistent, removeKey } from '@/lib/storage';
import { formatBytes, formatCount } from '@/lib';
import { useEntryStore, useSettingsStore } from '@/store';
import type { Entry } from '@/types';

/** Data section: export a backup, import one, or wipe everything. */
export function DataSection() {
  const entries = useEntryStore((state) => state.entries);
  const replaceAll = useEntryStore((state) => state.replaceAll);
  const updateSettings = useSettingsStore((state) => state.update);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    const result = await importBackupFile(file);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    // Merge against storage at write time: the file read is async, so a list captured
    // from an earlier render can drop entries added while the read was in flight.
    const current = useEntryStore.getState().entries;
    const importedIds = new Set(result.entries.map((entry) => entry.id));
    const merged: Entry[] = [...current.filter((entry) => !importedIds.has(entry.id)), ...result.entries];
    replaceAll(merged);
    // A backup carries settings too; restoring them is what makes it a full restore.
    if (result.settings) updateSettings(result.settings);
    toast.success(result.message);
  };

  return (
    <section aria-labelledby="data-heading" className="flex flex-col gap-3">
      <h2 id="data-heading" className="font-display text-lg text-primary-800 dark:text-primary-100">
        Data
      </h2>
      <p className="font-body text-xs text-primary-500 dark:text-primary-300">
        {`Using about ${formatBytes(estimateUsage())} of browser storage for ${formatCount(entries.length, 'entry', 'entries')}.`}
      </p>
      {isPersistent() ? null : (
        <p role="alert" className="font-body text-xs text-error">
          This browser is blocking local storage, so changes are kept in memory only and are lost when the page closes.
          Export a backup to keep them.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => exportBackup(entries)}>
          Export backup (JSON)
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          Import backup
        </Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          Clear all entries
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="sr-only"
        aria-label="Choose a backup file to import"
        onChange={(event) => {
          void handleImport(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Clear every entry?"
        description="All entries will be deleted from this browser. Export a backup first if you might want them back."
        confirmLabel="Delete everything"
        destructive
        onConfirm={() => {
          replaceAll([]);
          removeKey(STORAGE_KEYS.draft);
          setConfirmOpen(false);
          toast.success('All entries removed');
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}
