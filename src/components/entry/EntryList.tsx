import { useEffect, useState } from 'react';
import { FixedSizeGrid, type GridChildComponentProps } from 'react-window';
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

const ROW_HEIGHT = 232;
const COLUMN_GAP = 16;
const SCROLLER_HEIGHT = 640;

/** Column count that matches the Tailwind grid used for small collections. */
function columnsFor(width: number, layout: 'grid' | 'list'): number {
  if (layout === 'list') return 1;
  if (width >= 1280) return 3;
  if (width >= 640) return 2;
  return 1;
}

/** Tracks the container width so the virtualized grid matches the responsive grid. */
function useContainerWidth<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    setWidth(element.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, [element]);

  return { ref: setElement, width } as const;
}

/** Virtualized grid for large collections, plain grid below the threshold. */
export function EntryList({ entries, layout = 'grid', onToggleFavorite, onTagClick, className }: EntryListProps) {
  const { ref, width } = useContainerWidth<HTMLDivElement>();

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

  const columns = columnsFor(width, layout);
  const columnWidth = columns > 0 ? (width - COLUMN_GAP * (columns - 1)) / columns : width;
  const rowCount = Math.ceil(entries.length / columns);

  return (
    <div ref={ref} className={className}>
      {width > 0 ? (
        <FixedSizeGrid
          height={SCROLLER_HEIGHT}
          width={width}
          columnCount={columns}
          columnWidth={columnWidth + COLUMN_GAP}
          rowCount={rowCount}
          rowHeight={ROW_HEIGHT}
          itemData={{ entries, columns, columnWidth, layout, onToggleFavorite, onTagClick }}
          itemKey={({ rowIndex, columnIndex, data }) => {
            const item = data.entries[rowIndex * data.columns + columnIndex];
            return item ? item.id : `empty-${rowIndex}-${columnIndex}`;
          }}
          overscanRowCount={3}
        >
          {renderCell}
        </FixedSizeGrid>
      ) : null}
    </div>
  );
}

interface CellData {
  entries: Entry[];
  columns: number;
  columnWidth: number;
  layout: 'grid' | 'list';
  onToggleFavorite: (id: string) => void;
  onTagClick?: (tag: string) => void;
}

/** Renders one virtualized cell; empty trailing cells render nothing. */
function renderCell({ columnIndex, rowIndex, style, data }: GridChildComponentProps<CellData>) {
  const entry = data.entries[rowIndex * data.columns + columnIndex];
  if (!entry) return null;

  return (
    <div style={{ ...style, width: data.columnWidth, paddingBottom: 16, paddingRight: COLUMN_GAP }}>
      <EntryCard
        entry={entry}
        layout={data.layout}
        onToggleFavorite={data.onToggleFavorite}
        onTagClick={data.onTagClick}
      />
    </div>
  );
}
