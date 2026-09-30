import { useEffect } from 'react';
// Imported from its own module rather than the `@/components/ui` barrel: the barrel also
// exports Modal, which imports Framer Motion, and this file is in the entry chunk for
// every route. Going through the barrel pulled the whole animation library into the
// initial bundle just to mount the toast host.
import { ToastHost } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/common';
import { useEntryStore, useSettingsStore } from '@/store';
import { useSyncLifecycle } from '@/hooks/useSyncLifecycle';

export interface ProvidersProps {
  children: React.ReactNode;
}

/** Hydrates both stores from localStorage on mount. */
function useBootstrap() {
  const hydrateEntries = useEntryStore((state) => state.hydrate);
  const hydrateSettings = useSettingsStore((state) => state.hydrate);

  useEffect(() => {
    hydrateEntries();
    hydrateSettings();
  }, [hydrateEntries, hydrateSettings]);
}

/** Wraps the app with error handling, bootstrap side effects and toasts. */
export function Providers({ children }: ProvidersProps) {
  useBootstrap();
  // Mounted here rather than on a page so the session survives navigation: a sync that
  // only ran on the dashboard would leave the reader showing stale pages.
  useSyncLifecycle();

  return (
    <ErrorBoundary>
      {children}
      <ToastHost />
    </ErrorBoundary>
  );
}
