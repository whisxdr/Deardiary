import { useMemo } from 'react';
import { Button } from '@/components/ui';
import { ConfirmDialog } from '@/components/common';
import { exportBackup } from '@/services';
import { estimateUsage, isPersistent } from '@/lib/storage';
import { formatBytes, formatCount } from '@/lib';
import { useEntryStore, useSettingsStore } from '@/store';
import { RestoreDefaultsButton } from './RestoreDefaultsButton';
import { useDataActions } from './useDataActions';

/** Data section: export a backup, import one, or wipe everything. */
export function DataSection() {
  const entries = useEntryStore((state) => state.entries);
  // Subscribed rather than read once: restoring a backup writes settings, which grows
  // storage without changing the entry count, so the figure below must recompute.
  const settings = useSettingsStore((state) => state.settings);
  const { fileRef, confirmClear, setConfirmClear, pending, cancelPending, confirmPending, handleImport, handleClear } =
    useDataActions();

  // estimateUsage scans the stored keys; recompute when the entries or the settings change
  // rather than on the entry count alone, which missed a settings-only restore.
  const usageLabel = useMemo(
    () => `Using about ${formatBytes(estimateUsage())} of browser storage for ${formatCount(entries.length, 'entry', 'entries')}.`,
    [entries.length, settings],
  );

  return (
    <section aria-labelledby="data-heading" className="flex flex-col gap-3">
      <h2 id="data-heading" className="font-display text-lg text-primary-800 dark:text-primary-100">
        Data
      </h2>
      <p className="font-body text-xs text-primary-500 dark:text-primary-300">{usageLabel}</p>
      <p className="font-body text-xs text-primary-500 dark:text-primary-300">
        A backup contains your saved entries and settings. A draft that has not been published yet is not included.
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
        <Button variant="danger" onClick={() => setConfirmClear(true)}>
          Clear all entries
        </Button>
        <RestoreDefaultsButton />
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
        open={confirmClear}
        title="Clear every entry?"
        description="All entries will be deleted from this browser. Export a backup first if you might want them back."
        confirmLabel="Delete everything"
        destructive
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
      <ConfirmDialog
        open={pending !== null}
        title="Overwrite newer entries?"
        description={`${formatCount(pending?.newerCount ?? 0, 'entry', 'entries')} in this browser ${pending?.newerCount === 1 ? 'is' : 'are'} newer than the backup. Importing replaces ${pending?.newerCount === 1 ? 'it' : 'them'} with the older copy from the file.`}
        body="The backup is from an earlier point in time. Continue only if you mean to roll those entries back."
        confirmLabel="Import anyway"
        destructive
        onConfirm={confirmPending}
        onCancel={cancelPending}
      />
    </section>
  );
}
