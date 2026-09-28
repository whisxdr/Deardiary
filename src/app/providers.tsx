import { useEffect } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ToastHost } from '@/components/ui';
import { ErrorBoundary } from '@/components/common';
import { useEntryStore, useSettingsStore } from '@/store';

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

  return (
    <ErrorBoundary>
      {children}
      <ToastHost />
      <SpeedInsights />
    </ErrorBoundary>
  );
}
