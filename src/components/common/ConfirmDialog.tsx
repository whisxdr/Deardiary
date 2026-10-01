import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  /** Body paragraph; defaults to the wording used for deleting written entries. */
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DEFAULT_BODY =
  'This action cannot be undone. Make sure you have exported a backup if you need these words later.';

/** Yes/no dialog used before destructive actions such as deleting an entry. */
export function ConfirmDialog({
  open,
  title,
  description,
  body = DEFAULT_BODY,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="font-body text-sm text-primary-600 dark:text-primary-200">{body}</p>
    </Modal>
  );
}
