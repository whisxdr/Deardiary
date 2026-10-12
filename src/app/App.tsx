import { Suspense, lazy, useCallback, useState } from 'react';
import { AppRouter } from './router';
import { Providers } from './providers';

/**
 * The opening screen is code-split for the same reason the routes are: it is the one other
 * place that pulls Framer Motion in, and the entry chunk should not carry it. The main app
 * mounts behind it, so the fade reveals a page that has already painted.
 */
const SplashScreen = lazy(() =>
  import('@/components/splash').then((module) => ({ default: module.SplashScreen })),
);

/** Root component: bootstrap providers around the router, with the opening on top. */
export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const hideSplash = useCallback(() => setShowSplash(false), []);

  return (
    <Providers>
      <AppRouter />
      {showSplash ? (
        <Suspense fallback={null}>
          <SplashScreen onComplete={hideSplash} oncePerSession />
        </Suspense>
      ) : null}
    </Providers>
  );
}
