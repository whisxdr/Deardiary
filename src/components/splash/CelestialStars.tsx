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

/**
 * Star outline as an SVG path.
 *
 * Walks `points` spikes, alternating the outer and inner radius, so the shape is
 * generated instead of pasted in as a long `d` string. The static shell in index.html
 * carries the same two paths in plain markup, so the first painted frame and this one
 * sit on exactly the same pixels.
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
 * Every loop is a CSS keyframe on the compositor: three infinite animations are cheap
 * there, while the same loops driven from JavaScript kept a phone's main thread busy.
 * Rings sit inside the group they rotate with, and `.splash-pivot` measures the transform
 * origin against the viewBox, so the rotation centre is the ring centre.
 *
 * The glow is layered radial gradients rather than an SVG blur or drop-shadow filter: a
 * filter would repaint the whole subtree on every frame of the breathing loop.
 */
export function CelestialStars({ className }: CelestialStarsProps) {
  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cn('h-full w-full', className)}
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
        <g
          key={orbit.radius}
          className={cn(
            'splash-pivot [will-change:transform]',
            orbit.direction === 1 ? 'animate-orbit' : 'animate-orbit-reverse',
          )}
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
                <path
                  d={SPARKLE}
                  fill={CREAM}
                  className="animate-star-twinkle"
                  style={{ animationDelay: `${star.delay}s` }}
                />
              </g>
            );
          })}
        </g>
      ))}

      {/* The centre star, breathing in place. */}
      <g className="splash-pivot animate-breathe [will-change:transform]">
        <g transform={`translate(${CENTER} ${CENTER})`}>
          <circle r="34" fill="url(#splash-core)" />
          <path d={STAR_CROSS} fill={GOLD} transform="rotate(45)" />
          <path d={STAR_SPIKES} fill={GOLD} fillOpacity="0.55" transform="rotate(22.5)" />
          <path d={STAR_SPIKES} fill={CREAM} fillOpacity="0.95" />
          <circle r="2.6" fill={CREAM} />
        </g>
      </g>
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
