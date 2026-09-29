import { FloppyDisk, PaperPlaneTilt, Trash } from '@phosphor-icons/react';
import { Button } from '@/components/ui';

export interface SidebarActionsProps {
  onSaveDraft: () => void;
  onPublish: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

/** Save, publish and delete buttons at the foot of the write sidebar. */
export function SidebarActions({ onSaveDraft, onPublish, onDelete, canDelete }: SidebarActionsProps) {
  return (
    <>
      <Button variant="outline" onClick={onSaveDraft}>
        <FloppyDisk size={16} weight="regular" aria-hidden="true" />
        Save draft
      </Button>
      <Button variant="gold" onClick={onPublish}>
        <PaperPlaneTilt size={16} weight="regular" aria-hidden="true" />
        Publish
      </Button>
      {canDelete ? (
        <Button variant="danger" onClick={onDelete}>
          <Trash size={16} weight="regular" aria-hidden="true" />
          Delete
        </Button>
      ) : null}
    </>
  );
}
