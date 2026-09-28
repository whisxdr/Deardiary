import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { usePrefersReducedMotion } from '@/hooks';

const PARTICLE_COUNT = 14;

interface Particle {
  id: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

/** Soft drifting gold dust; disabled when the visitor prefers reduced motion. */
export function GoldDust({ count = PARTICLE_COUNT }: { count?: number }) {
  const reducedMotion = usePrefersReducedMotion();
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: count }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 4,
        duration: 5 + Math.random() * 5,
      })),
    [count],
  );

  if (reducedMotion) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full bg-accent-gold/70"
          style={{ left: `${particle.left}%`, width: particle.size, height: particle.size }}
          initial={{ y: '110%', opacity: 0 }}
          animate={{ y: '-10%', opacity: [0, 0.8, 0] }}
          transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}
