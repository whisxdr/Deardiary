import { useEffect } from 'react';
import { ToastHost } from '@/components/ui';
import { ErrorBoundary } from '@/components/common';
import { SEED_ON_FIRST_VISIT, STORAGE_KEYS } from '@/constants';
import { dummyEntries } from '@/data';
import { hasKey } from '@/lib/storage';
import { useEntryStore, useSettingsStore } from '@/store';

export interface ProvidersProps {
  children: React.ReactNode;
}

/** Seeds the demo entries once, then hydrates both stores. */
function useBootstrap() {
  const replaceAll = useEntryStore((state) => state.replaceAll);
  const hydrateEntries = useEntryStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);

  useEffect(() => {
    if (SEED_ON_FIRST_VISIT && !hasKey(STORAGE_KEYS.seeded)) {
      replaceAll(dummyEntries);
      window.localStorage.setItem(STORAGE_KEYS.seeded, new Date().toISOString());
    }
    hydrateEntries();
    hydrateSettings();
  }, [hydrateEntries, hydrateSettings, replaceAll]);
}

/** Wraps the app with error handling, bootstrap side effects and toasts. */
export function Providers({ children }: ProvidersProps) {
  useBootstrap();

  return (
    <ErrorBoundary>
      {children}
      <ToastHost />
    </ErrorBoundary>
  );
}
