import { useRef, useState } from 'react';
import { Button, toast } from '@/components/ui';
import { ConfirmDialog } from '@/components/common';
import { STORAGE_KEYS } from '@/constants';
import { exportBackup, importBackupFile } from '@/services';
import { estimateUsage } from '@/lib/storage';
import { formatBytes } from '@/lib';
import { useEntryStore } from '@/store';
import type { Entry } from '@/types';

/** Data section: export a backup, import one, or wipe everything. */
export function DataSection() {
  const entries = useEntryStore((state) => state.entries);
  const replaceAll = useEntryStore((state) => state.replaceAll);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    const result = await importBackupFile(file);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    const merged: Entry[] = [...entries.filter((entry) => !result.entries.some((item) => item.id === entry.id)), ...result.entries];
    replaceAll(merged);
    toast.success(result.message);
  };

  return (
    <section aria-labelledby="data-heading" className="flex flex-col gap-3">
      <h2 id="data-heading" className="font-display text-lg text-primary-800 dark:text-primary-100">
        Data
      </h2>
      <p className="font-body text-xs text-primary-500 dark:text-primary-300">
        {`Using about ${formatBytes(estimateUsage())} of browser storage for ${entries.length} entries.`}
      </p>
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
          window.localStorage.removeItem(STORAGE_KEYS.draft);
          setConfirmOpen(false);
          toast.success('All entries removed');
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}
