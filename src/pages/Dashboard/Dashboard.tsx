import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout, ComposerModal, FAB } from '@/components/layout';
import { ROUTES } from '@/constants';
import { useDebounce, useEntries, useFilter } from '@/hooks';
import { useEntryStore, useSettingsStore, useUiStore } from '@/store';
import { DashboardGrid } from './DashboardGrid';
import { DashboardHeader } from './DashboardHeader';
import { DashboardToolbar } from './DashboardToolbar';
import type { SelectOption } from '@/types';

/** Entry library: search, filter, sort and browse every written page. */
export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { entries } = useEntries();
  const displayName = useSettingsStore((state) => state.settings.displayName);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const favorite = useEntryStore((state) => state.favorite);
  const viewMode = useUiStore((state) => state.viewMode);
  const setViewMode = useUiStore((state) => state.setViewMode);
  const composerOpen = useUiStore((state) => state.composerOpen);
  const setComposerOpen = useUiStore((state) => state.setComposerOpen);

  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const debouncedSearch = useDebounce(search);
  const { filters, update, reset, filtered } = useFilter(entries);

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  useEffect(() => {
    if (debouncedSearch !== filters.query) update({ query: debouncedSearch });
  }, [debouncedSearch, filters.query, update]);

  const tagOptions = useMemo<SelectOption[]>(() => {
    const tags = new Set<string>();
    entries.forEach((entry) => entry.tags.forEach((tag) => tags.add(tag)));
    return [
      { value: 'all', label: 'All tags' },
      ...Array.from(tags)
        .sort((a, b) => a.localeCompare(b))
        .map((tag) => ({ value: tag, label: `#${tag}` })),
    ];
  }, [entries]);

  const clearAll = () => {
    reset();
    setSearch('');
  };

  return (
    <AppLayout searchValue={search} onSearchChange={setSearch}>
      <div className="flex flex-col gap-5">
        <DashboardHeader total={entries.length} visible={filtered.length} displayName={displayName} />
        <DashboardToolbar
          filters={filters}
          tagOptions={tagOptions}
          resultCount={filtered.length}
          viewMode={viewMode}
          onChange={update}
          onViewModeChange={setViewMode}
          onReset={clearAll}
        />
        <DashboardGrid
          entries={filtered}
          totalEntries={entries.length}
          viewMode={viewMode}
          onToggleFavorite={favorite}
          onTagClick={(tag) => update({ tag })}
          onClearFilters={clearAll}
        />
      </div>
      <FAB onClick={() => setComposerOpen(true)} />
      <ComposerModal
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSelect={(templateId, backdated) => {
          setComposerOpen(false);
          const params = new URLSearchParams({ template: templateId });
          if (backdated) params.set('backdated', 'true');
          navigate(`${ROUTES.write}?${params.toString()}`);
        }}
      />
    </AppLayout>
  );
}
