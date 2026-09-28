import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import { LIMITS } from '@/constants';
import { EntryCard } from './EntryCard';
import type { Entry } from '@/types';

export interface EntryListProps {
  entries: Entry[];
  layout?: 'grid' | 'list';
  onToggleFavorite: (id: string) => void;
  onTagClick?: (tag: string) => void;
  className?: string;
}

const ROW_HEIGHT = 220;

/** Virtualized list for large collections, plain grid below the threshold. */
export function EntryList({ entries, layout = 'grid', onToggleFavorite, onTagClick, className }: EntryListProps) {
  if (entries.length <= LIMITS.virtualizeThreshold) {
    return (
      <div
        className={`grid gap-4 ${
          layout === 'grid' ? 'sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
        } ${className ?? ''}`}
      >
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            layout={layout}
            onToggleFavorite={onToggleFavorite}
            onTagClick={onTagClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      <FixedSizeList
        height={640}
        width="100%"
        itemCount={entries.length}
        itemSize={ROW_HEIGHT}
        itemData={{ entries, layout, onToggleFavorite, onTagClick }}
        itemKey={(index, data: { entries: Entry[] }) => data.entries[index].id}
        overscanCount={4}
      >
        {renderRow}
      </FixedSizeList>
    </div>
  );
}

interface RowData {
  entries: Entry[];
  layout: 'grid' | 'list';
  onToggleFavorite: (id: string) => void;
  onTagClick?: (tag: string) => void;
}

/** Renders one virtualized row. */
function renderRow({ index, style, data }: ListChildComponentProps<RowData>) {
  const entry = data.entries[index];
  return (
    <div style={{ ...style, paddingBottom: 16, paddingRight: 8 }}>
      <EntryCard
        entry={entry}
        layout={data.layout}
        onToggleFavorite={data.onToggleFavorite}
        onTagClick={data.onTagClick}
      />
    </div>
  );
}
