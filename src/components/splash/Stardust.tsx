import { useMemo } from 'react';
import { usePrefersReducedMotion } from '@/hooks';

/** Motes scattered across the screen; small screens get fewer. */
const MOTE_COUNT = 12;
const MOTE_COUNT_SMALL = 8;

interface Mote {
  id: number;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

/**
 * Twinkling stardust behind the star system.
 *
 * CSS keyframes rather than a script loop: this is a dozen infinite animations, and the
 * cover's rising dust already learned that many JS-driven loops keep a phone's main
 * thread busy while a compositor animation costs nothing per frame.
 */
export function Stardust({ count }: { count?: number }) {
  const reducedMotion = usePrefersReducedMotion();

  const motes = useMemo<Mote[]>(() => {
    const total =
      count ?? (typeof window !== 'undefined' && window.innerWidth < 640 ? MOTE_COUNT_SMALL : MOTE_COUNT);
    return Array.from({ length: total }, (_, index) => ({
      id: index,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 1.5 + Math.random() * 2.5,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 4,
    }));
  }, [count]);

  if (reducedMotion) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {motes.map((mote) => (
        <span
          key={mote.id}
          className="absolute rounded-full bg-accent-cream/70 motion-safe:animate-twinkle [will-change:transform,opacity]"
          style={{
            left: `${mote.left}%`,
            top: `${mote.top}%`,
            width: mote.size,
            height: mote.size,
            animationDelay: `${mote.delay}s`,
            animationDuration: `${mote.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
