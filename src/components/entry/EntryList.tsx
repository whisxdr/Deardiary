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

/** Tracks the container width and the viewport height the scroller may use. */
function useContainerWidth<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    setWidth(element.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, [element]);

  // A fixed scroller height is wrong on a phone: 640px inside a 700px viewport leaves the
  // grid as a scroll box inside the page scroll box, which is hard to use with a thumb.
  useEffect(() => {
    const onResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return { ref: setElement, width, viewportHeight } as const;
}

/** Virtualized grid for large collections, plain grid below the threshold. */
export function EntryList({ entries, layout = 'grid', onToggleFavorite, onTagClick, className }: EntryListProps) {
  const { ref, width, viewportHeight } = useContainerWidth<HTMLDivElement>();

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
  // Never taller than the viewport, so the grid is the only thing that scrolls.
  const height = Math.max(320, Math.min(SCROLLER_HEIGHT, viewportHeight - 220));

  return (
    <div ref={ref} className={className}>
      {width > 0 ? (
        <FixedSizeGrid
          height={height}
          width={width}
          columnCount={columns}
          // The grid allocates this per column, and the cell inside is exactly this wide,
          // so the total is `width`. Making the cell `columnWidth` while the grid allocated
          // `columnWidth + gap` overflowed the container by one gap.
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
    // `style.width` already includes the column gap the grid allocated; the padding sits
    // inside it so the visible card is exactly one column wide.
    <div style={{ ...style, paddingBottom: 16, paddingRight: COLUMN_GAP }}>
      <EntryCard
        entry={entry}
        layout={data.layout}
        onToggleFavorite={data.onToggleFavorite}
        onTagClick={data.onTagClick}
      />
    </div>
  );
}
