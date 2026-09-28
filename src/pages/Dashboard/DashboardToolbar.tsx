import { ArrowCounterClockwise, List, SquaresFour, Star } from '@phosphor-icons/react';
import { Select } from '@/components/ui';
import { Chip } from '@/components/ui';
import { IconButton } from '@/components/common';
import { MOOD_FILTER_OPTIONS, SORT_OPTIONS } from '@/constants';
import type { EntryFilters, SelectOption, ViewMode } from '@/types';

export interface DashboardToolbarProps {
  filters: EntryFilters;
  tagOptions: SelectOption[];
  resultCount: number;
  viewMode: ViewMode;
  onChange: (patch: Partial<EntryFilters>) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onReset: () => void;
}

/** Mood, tag, sort, favorite and layout controls above the entry grid. */
export function DashboardToolbar({
  filters,
  tagOptions,
  resultCount,
  viewMode,
  onChange,
  onViewModeChange,
  onReset,
}: DashboardToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary-200/70 bg-accent-cream/90 px-3 py-2 shadow-soft dark:border-primary-700 dark:bg-primary-800/70">
      <Select
        label="Mood"
        options={MOOD_FILTER_OPTIONS}
        value={filters.mood}
        onChange={(event) => onChange({ mood: event.target.value })}
      />
      <Select
        label="Tag"
        options={tagOptions}
        value={filters.tag}
        onChange={(event) => onChange({ tag: event.target.value })}
      />
      <Select
        label="Sort"
        options={SORT_OPTIONS}
        value={filters.sort}
        onChange={(event) => onChange({ sort: event.target.value })}
      />

      <Chip active={filters.favoritesOnly} onClick={() => onChange({ favoritesOnly: !filters.favoritesOnly })}>
        <Star size={14} weight={filters.favoritesOnly ? 'fill' : 'regular'} color="#C9A961" aria-hidden="true" />
        Favorites
      </Chip>

      <span className="font-body text-xs text-primary-500 dark:text-primary-300">{`${resultCount} results`}</span>

      <div className="ml-auto flex items-center gap-1">
        <IconButton
          label="Grid view"
          active={viewMode === 'grid'}
          onClick={() => onViewModeChange('grid')}
          icon={<SquaresFour size={20} weight={viewMode === 'grid' ? 'fill' : 'regular'} aria-hidden="true" />}
        />
        <IconButton
          label="List view"
          active={viewMode === 'list'}
          onClick={() => onViewModeChange('list')}
          icon={<List size={20} weight={viewMode === 'list' ? 'fill' : 'regular'} aria-hidden="true" />}
        />
        <IconButton
          label="Reset filters"
          onClick={onReset}
          icon={<ArrowCounterClockwise size={20} aria-hidden="true" />}
        />
      </div>
    </div>
  );
}
