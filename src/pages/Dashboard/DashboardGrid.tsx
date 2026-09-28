import { EntryList } from '@/components/entry';
import { EmptyState } from '@/components/common';
import { EmptyDiary, EmptySearch } from '@/components/illustrations';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants';
import type { Entry, ViewMode } from '@/types';

export interface DashboardGridProps {
  entries: Entry[];
  totalEntries: number;
  viewMode: ViewMode;
  onToggleFavorite: (id: string) => void;
  onTagClick: (tag: string) => void;
  onClearFilters: () => void;
}

/** Entry grid, with separate empty states for "no entries" and "no matches". */
export function DashboardGrid({
  entries,
  totalEntries,
  viewMode,
  onToggleFavorite,
  onTagClick,
  onClearFilters,
}: DashboardGridProps) {
  if (entries.length === 0) {
    return totalEntries === 0 ? (
      <EmptyState
        title="Your diary is still empty"
        description="Start writing your first entry and begin your journey. The first page is always the hardest."
        illustration={<EmptyDiary size={320} />}
        action={
          <Link to={ROUTES.write}>
            <Button variant="gold">Write your first entry</Button>
          </Link>
        }
      />
    ) : (
      <EmptyState
        title="No entries match those filters"
        description="Try a different mood, clear the search box or reset the toolbar to see everything again."
        illustration={<EmptySearch size={320} />}
        action={
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    );
  }

  return (
    <EntryList
      entries={entries}
      layout={viewMode}
      onToggleFavorite={onToggleFavorite}
      onTagClick={onTagClick}
    />
  );
}
