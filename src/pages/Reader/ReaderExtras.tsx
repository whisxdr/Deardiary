import { Button } from '@/components/ui';
import { ConfirmDialog, EmptyState } from '@/components/common';
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
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="ghost" size="sm" onClick={() => exportEntryAsMarkdown(entry)}>
        Export Markdown
      </Button>
      <Button variant="ghost" size="sm" onClick={() => exportEntryAsText(entry)}>
        Export plain text
      </Button>
    </div>
  );
}
