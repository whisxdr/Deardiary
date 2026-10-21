import { Button } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { exportEntryAsMarkdown, exportEntryAsText } from '@/services';
import type { Entry } from '@/types';

/** Shown when the requested entry id is not in the book. */
export function ReaderMissing({ onBack }: { onBack: () => void }) {
  return (
    <EmptyState
      title="That page is missing"
      description="The entry you asked for is not in this book. It may have been deleted."
      action={
        <Button variant="outline" onClick={onBack}>
          Back to entries
        </Button>
      }
    />
  );
}

/** Confirmation shown before an entry is deleted from the reader. */
export function ReaderDeleteDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      title="Delete this entry?"
      description="The page will be removed from your diary on this device."
      confirmLabel="Delete entry"
      destructive
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

/** Secondary export actions that do not need a confirmation step. */
export function ReaderExportRow({ entry }: { entry: Entry }) {
  const linkClass =
    'cursor-pointer underline decoration-primary-300/60 underline-offset-2 transition-colors duration-fast hover:text-primary-800 dark:hover:text-primary-100';
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-xs text-muted">
      <span className="text-[10px] uppercase tracking-wide">Download as</span>
      <button type="button" className={linkClass} onClick={() => exportEntryAsMarkdown(entry)}>
        Markdown
      </button>
      <span aria-hidden="true">·</span>
      <button type="button" className={linkClass} onClick={() => exportEntryAsText(entry)}>
        Plain text
      </button>
    </div>
  );
}
