import { useEffect, useRef } from 'react';

/**
 * Runs `flush` when the component unmounts and when the page is hidden.
 *
 * Unmount covers in-app navigation, where React tears the component down. `pagehide`
 * covers reload, tab close and leaving the site, where unmount never runs. The latest
 * callback is kept in a ref so the listeners are registered once.
 */
export function useSaveOnLeave(flush: () => void): void {
  const flushRef = useRef(flush);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    const run = () => flushRef.current();
    window.addEventListener('pagehide', run);
    return () => {
      window.removeEventListener('pagehide', run);
      run();
    };
  }, []);
}
