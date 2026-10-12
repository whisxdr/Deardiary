import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { usePrefersReducedMotion } from '@/hooks';
import { cn } from '@/utils';

/** Square viewBox, so the orbit centre and the SVG centre are the same point. */
const SIZE = 320;
const CENTER = SIZE / 2;

const GOLD = '#C9A961';
const CREAM = '#F5F0E6';

/** Spikes of the little travelling stars, in viewBox units; orbits scale from this. */
const SPARKLE_UNIT = 6;

/** One full orbit. Slow enough to read as drifting rather than spinning. */
const ORBIT_SECONDS = 10;

/**
 * Star outline as an SVG path.
 *
 * Walks `points` spikes, alternating the outer and inner radius, so the shape is
 * generated instead of pasted in as a long `d` string.
 */
function starPath(outer: number, inner: number, points: number): string {
  const step = Math.PI / points;
  let path = '';
  for (let index = 0; index < points * 2; index += 1) {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = index * step - Math.PI / 2;
    const x = (Math.cos(angle) * radius).toFixed(2);
    const y = (Math.sin(angle) * radius).toFixed(2);
    path += `${index === 0 ? 'M' : 'L'}${x} ${y}`;
  }
  return `${path}Z`;
}

/** Four-point spikes, plus the same spikes turned 45°: together the vintage 8-point star. */
const STAR_SPIKES = starPath(46, 13, 4);
const STAR_CROSS = starPath(33, 9, 4);
const SPARKLE = starPath(SPARKLE_UNIT, 2, 4);

interface OrbitStar {
  /** Position on the ring, in degrees. */
  angle: number;
  /** Spike length in viewBox units. */
  size: number;
  /** Twinkle offset, so the stars on one ring do not pulse in step. */
  delay: number;
}

interface Orbit {
  radius: number;
  dash: string;
  /** `-1` runs the ring backwards, which reads as depth without a second effect. */
  direction: 1 | -1;
  stars: OrbitStar[];
}

const ORBITS: Orbit[] = [
  {
    radius: 88,
    dash: '3 10',
    direction: 1,
    stars: [
      { angle: 18, size: 7, delay: 0 },
      { angle: 205, size: 5, delay: 1.1 },
    ],
  },
  {
    radius: 126,
    dash: '2 14',
    direction: -1,
    stars: [
      { angle: 96, size: 6, delay: 0.6 },
      { angle: 292, size: 4.5, delay: 1.7 },
    ],
  },
];

export interface CelestialStarsProps {
  className?: string;
}

/**
 * Rotating star system: an 8-point star inside two orbit rings, each ring carrying stars.
 *
 * Every ring sits inside the group it rotates with, so the group's bounding box is the
 * ring itself. Motion rotates an SVG child about its own box, which makes the ring centre
 * the rotation origin without any `transform-origin` guesswork.
 *
 * The `initial` transform on each animated group is load-bearing: Motion only copies an
 * SVG element's transform into a rendered CSS transform after it has measured the node,
 * and it measures on the first update where a transform value exists. A keyframe-only
 * `animate` misses that window and the rotation is dropped without a warning.
 *
 * The glow is layered radial gradients rather than an SVG blur or drop-shadow filter: a
 * filter would repaint the whole subtree on every frame of the breathing loop.
 */
export function CelestialStars({ className }: CelestialStarsProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cn('h-full w-full [will-change:transform,opacity]', className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="splash-halo">
          <stop offset="0%" stopColor={GOLD} stopOpacity="0.34" />
          <stop offset="55%" stopColor={GOLD} stopOpacity="0.08" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="splash-core">
          <stop offset="0%" stopColor={CREAM} stopOpacity="0.9" />
          <stop offset="45%" stopColor={GOLD} stopOpacity="0.35" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft halo behind the whole system. */}
      <circle cx={CENTER} cy={CENTER} r={CENTER} fill="url(#splash-halo)" />

      {ORBITS.map((orbit) => (
        <motion.g
          key={orbit.radius}
          initial={{ rotate: 0 }}
          animate={{ rotate: reducedMotion ? 0 : orbit.direction === 1 ? [0, 360] : [360, 0] }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { duration: ORBIT_SECONDS, repeat: Infinity, ease: 'linear' }
          }
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={orbit.radius}
            fill="none"
            stroke={GOLD}
            strokeOpacity="0.22"
            strokeWidth="1"
            strokeDasharray={orbit.dash}
          />
          {orbit.stars.map((star) => {
            const radians = (star.angle * Math.PI) / 180;
            const x = (CENTER + Math.cos(radians) * orbit.radius).toFixed(2);
            const y = (CENTER + Math.sin(radians) * orbit.radius).toFixed(2);
            const scale = (star.size / SPARKLE_UNIT).toFixed(2);
            return (
              // Wrapper carries the position so the animated path only ever touches opacity.
              <g key={star.angle} transform={`translate(${x} ${y}) scale(${scale})`}>
                <motion.path
                  d={SPARKLE}
                  fill={CREAM}
                  animate={reducedMotion ? { opacity: 0.85 } : { opacity: [0.35, 1, 0.35] }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: star.delay }
                  }
                />
              </g>
            );
          })}
        </motion.g>
      ))}

      {/* The centre star, breathing in place. */}
      <motion.g
        initial={{ scale: 1 }}
        animate={reducedMotion ? { scale: 1 } : { scale: [0.95, 1.05, 0.95] }}
        transition={
          reducedMotion ? { duration: 0 } : { duration: 5.4, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <g transform={`translate(${CENTER} ${CENTER})`}>
          <circle r="34" fill="url(#splash-core)" />
          <path d={STAR_CROSS} fill={GOLD} transform="rotate(45)" />
          <path d={STAR_SPIKES} fill={GOLD} fillOpacity="0.55" transform="rotate(22.5)" />
          <path d={STAR_SPIKES} fill={CREAM} fillOpacity="0.95" />
          <circle r="2.6" fill={CREAM} />
        </g>
      </motion.g>
    </svg>
  );
}

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
 * CSS keyframes rather than a Motion loop: this is a dozen infinite animations, and the
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
