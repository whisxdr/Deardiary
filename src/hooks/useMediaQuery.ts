import { useEffect, useState } from 'react';

/** Tracks a CSS media query, defaulting to `false` during server rendering. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Convenience wrapper for the small breakpoint used across the layout. */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/** True when the visitor asked for reduced motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
