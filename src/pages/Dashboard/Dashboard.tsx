import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout, ComposerModal, FAB } from '@/components/layout';
import { ROUTES } from '@/constants';
import { useDebounce, useEntries, useFilter } from '@/hooks';
import { useEntryStore, useSettingsStore, useUiStore } from '@/store';
import { DashboardGrid } from './DashboardGrid';
import { DashboardHeader } from './DashboardHeader';
import { DashboardToolbar } from './DashboardToolbar';
import { tagOptionsFor } from './dashboardFilters';

/** Entry library: search, filter, sort and browse every written page. */
export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { entries } = useEntries();
  const displayName = useSettingsStore((state) => state.settings.displayName);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const favorite = useEntryStore((state) => state.favorite);
  const viewMode = useUiStore((state) => state.viewMode);
  const setViewMode = useUiStore((state) => state.setViewMode);
  const composerOpen = useUiStore((state) => state.composerOpen);
  const setComposerOpen = useUiStore((state) => state.setComposerOpen);

  const urlTag = searchParams.get('tag') ?? 'all';
  const urlQuery = searchParams.get('q') ?? '';

  const [search, setSearch] = useState(urlQuery);
  const debouncedSearch = useDebounce(search);
  // Reader and Stats link here with ?tag=, so seed the filter from the URL.
  const { filters, update, reset, filtered } = useFilter(entries, { tag: urlTag, query: urlQuery });

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  // The header search on other pages routes here, so follow the URL while mounted.
  const updateRef = useRef(update);
  updateRef.current = update;
  useEffect(() => {
    setSearch(urlQuery);
    updateRef.current({ query: urlQuery });
  }, [urlQuery]);

  useEffect(() => {
    if (debouncedSearch !== filters.query) update({ query: debouncedSearch });
  }, [debouncedSearch, filters.query, update]);

  const tagOptions = useMemo(() => tagOptionsFor(entries, urlTag), [entries, urlTag]);

  /** Clears every filter, including the ones carried by the URL. */
  const clearAll = () => {
    reset();
    setSearch('');
    if (searchParams.size > 0) setSearchParams({}, { replace: true });
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
