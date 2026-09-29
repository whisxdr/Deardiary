import { useEffect, useRef } from 'react';

/**
 * Tracks the pointer and writes a small tilt offset to CSS variables on a target.
 *
 * The offset goes to `--tilt-x` / `--tilt-y` through a ref instead of React state: a
 * mousemove fires up to once per frame, and calling setState on each one re-rendered
 * the whole cover subtree. Writing a CSS variable touches no React tree.
 *
 * Pointer input is skipped on touch-only devices, where there is no hover to track and
 * the listener would only cost memory.
 */
export function useParallax<T extends HTMLElement>(strength = 6) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let nextX = 0;
    let nextY = 0;

    const apply = () => {
      frame = 0;
      element.style.setProperty('--tilt-x', `${nextX}deg`);
      element.style.setProperty('--tilt-y', `${nextY}deg`);
    };

    const onMove = (event: MouseEvent) => {
      nextX = (event.clientX / window.innerWidth - 0.5) * strength;
      nextY = (event.clientY / window.innerHeight - 0.5) * -strength;
      // Coalesce to one write per frame; mousemove can fire more often than that.
      if (!frame) frame = window.requestAnimationFrame(apply);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [strength]);

  return ref;
}
