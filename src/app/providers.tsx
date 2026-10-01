import { useEffect } from 'react';
// Imported from its own module rather than the `@/components/ui` barrel: the barrel also
// exports Modal, which imports Framer Motion, and this file is in the entry chunk for
// every route. Going through the barrel pulled the whole animation library into the
// initial bundle just to mount the toast host.
import { ToastHost } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/common';
import { useEntryStore, useSettingsStore } from '@/store';
import { useStorageWarning } from '@/hooks/useStorageWarning';

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
  // A refused write has to be visible from every page, not just the composer.
  useStorageWarning();

  return (
    <ErrorBoundary>
      {children}
      <ToastHost />
    </ErrorBoundary>
  );
}
