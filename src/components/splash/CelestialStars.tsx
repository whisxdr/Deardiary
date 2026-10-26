import { cn } from '@/utils';
import {
  CENTER,
  CREAM,
  GOLD,
  ORBITS,
  SIZE,
  SPARKLE,
  SPARKLE_UNIT,
  STAR_CROSS,
  STAR_SPIKES,
} from './starGeometry';

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
