import { useMemo } from 'react';
import { usePrefersReducedMotion } from '@/hooks';

/** Desktop particle count; small screens use fewer, see below. */
const PARTICLE_COUNT = 10;

interface Particle {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

/**
 * Soft drifting gold dust; disabled when the visitor prefers reduced motion.
 *
 * The drift is a CSS keyframe animation rather than a Framer Motion loop: fourteen
 * JS-driven infinite animations kept the main thread busy on a phone, while a
 * compositor animation costs no JS per frame. Particles also scale down with the
 * viewport, since a phone shows a smaller cover with less room to fill.
 */
export function GoldDust({ count }: { count?: number }) {
  const reducedMotion = usePrefersReducedMotion();

  const particles = useMemo<Particle[]>(() => {
    // A phone does not need a desktop's worth of particles to read as "dust".
    const total = count ?? (typeof window !== 'undefined' && window.innerWidth < 640 ? 5 : PARTICLE_COUNT);
    return Array.from({ length: total }, (_, index) => ({
      id: index,
      left: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 4,
      duration: 5 + Math.random() * 5,
    }));
  }, [count]);

  if (reducedMotion) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute rounded-full bg-accent-gold/70 motion-safe:animate-dust"
          style={{
            left: `${particle.left}%`,
            width: particle.size,
            height: particle.size,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
