import { EntryList } from '@/components/entry';
import { EmptyState } from '@/components/common';
import { EmptyDiary, EmptySearch } from '@/components/illustrations';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants';
import { formatCount } from '@/lib';
import type { Entry, ViewMode } from '@/types';

export interface DashboardGridProps {
  entries: Entry[];
  /** Entries in the list before filtering, so 0 means the visible diary is genuinely empty. */
  totalEntries: number;
  /** Private entries filtered out by "hide private entries", not shown in the grid. */
  hiddenCount: number;
  viewMode: ViewMode;
  onToggleFavorite: (id: string) => void;
  onTagClick: (tag: string) => void;
  onClearFilters: () => void;
}

/** Entry grid, with separate empty states for "no entries", "no matches" and "all hidden". */
export function DashboardGrid({
  entries,
  totalEntries,
  hiddenCount,
  viewMode,
  onToggleFavorite,
  onTagClick,
  onClearFilters,
}: DashboardGridProps) {
  if (entries.length === 0) {
    // A diary whose every entry is private is not empty: without this the page claimed
    // the user had never written anything and offered to start their first entry.
    if (totalEntries === 0 && hiddenCount > 0) {
      return (
        <EmptyState
          title={`${formatCount(hiddenCount, 'private entry', 'private entries')} hidden`}
          description='Turn off "Hide private entries by default" in Settings to see them here.'
          illustration={<EmptyDiary size={320} />}
          action={
            <Link to={ROUTES.settings}>
              <Button variant="outline">Open Settings</Button>
            </Link>
          }
        />
      );
    }
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
