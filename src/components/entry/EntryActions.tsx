import { PencilSimple, Printer, ShareNetwork, Star, Trash } from '@phosphor-icons/react';
import { Button, Tooltip } from '@/components/ui';
import { IconButton } from '@/components/common';

export interface EntryActionsProps {
  isFavorite: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onExport: () => void;
  onPrint: () => void;
  onToggleFavorite: () => void;
  layout?: 'row' | 'column';
}

/** Action cluster used by the reader page. */
export function EntryActions({
  isFavorite,
  onEdit,
  onDelete,
  onShare,
  onExport,
  onPrint,
  onToggleFavorite,
  layout = 'row',
}: EntryActionsProps) {
  return (
    <div className={`flex gap-2 ${layout === 'column' ? 'flex-col' : 'flex-wrap items-center'}`}>
      <Button variant="gold" size="sm" onClick={onEdit}>
        <PencilSimple size={16} weight="regular" aria-hidden="true" />
        Edit
      </Button>
      <Button variant="outline" size="sm" onClick={onExport}>
        Export
      </Button>
      <div className="flex items-center gap-1">
        <Tooltip label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
          <IconButton
            label="Toggle favorite"
            active={isFavorite}
            onClick={onToggleFavorite}
            icon={<Star size={20} weight={isFavorite ? 'fill' : 'regular'} color="#C9A961" aria-hidden="true" />}
          />
        </Tooltip>
        <Tooltip label="Share">
          <IconButton label="Share entry" onClick={onShare} icon={<ShareNetwork size={20} aria-hidden="true" />} />
        </Tooltip>
        <Tooltip label="Print">
          <IconButton label="Print entry" onClick={onPrint} icon={<Printer size={20} aria-hidden="true" />} />
        </Tooltip>
        <Tooltip label="Delete">
          <IconButton
            label="Delete entry"
            onClick={onDelete}
            icon={<Trash size={20} aria-hidden="true" />}
            className="text-error hover:bg-error/10"
          />
        </Tooltip>
      </div>
    </div>
  );
}
