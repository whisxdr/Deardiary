import { useCallback, useState } from 'react';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { AppRouter } from './router';
import { Providers } from './providers';

/**
 * Root component: providers around the router, with the opening on top.
 *
 * The opening screen is a plain import rather than a lazy chunk: it is CSS-only, so it no
 * longer drags Framer Motion onto the first paint, and mounting it with the app is what
 * lets it take over from the static shell in index.html without a gap between the two.
 */
export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const hideSplash = useCallback(() => setShowSplash(false), []);

  return (
    <Providers>
      <AppRouter />
      {showSplash ? <SplashScreen onComplete={hideSplash} oncePerSession /> : null}
    </Providers>
  );
}
