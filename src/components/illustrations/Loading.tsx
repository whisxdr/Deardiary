import { ILLUSTRATION_COLORS as C, ILLUSTRATION_STROKE as S } from './illustrationTheme';
import type { IllustrationProps } from './illustrationTheme';

/**
 * Open leather diary: the route-chunk loading state.
 *
 * The animation is CSS keyframes rather than Framer Motion because this component renders
 * inside the router's Suspense fallback, where the animation library would land in the
 * entry chunk for every visitor.
 */
export function Loading({ size = 220, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 400 300"
      fill="none"
      className={className}
      role="img"
      aria-label="A leather diary cover opening to reveal its pages"
    >
      <g aria-hidden="true">
        <ellipse cx="200" cy="150" rx="188" ry="140" fill={C.gold} opacity="0.12" />

        <path d="M72 92h280v156H72z" fill={C.cream} stroke={C.leather} strokeWidth="1.5" strokeLinejoin={S.linejoin} />
        <path d="M67 87h280v156H67z" fill={C.cream} stroke={C.leather} strokeWidth="1.5" strokeLinejoin={S.linejoin} />
        <path d="M62 82h280v156H62z" fill={C.paper} stroke={C.leather} strokeWidth={S.width} strokeLinejoin={S.linejoin} />
        <path d="M300 96v128" stroke={C.gold} strokeWidth="1.5" strokeLinecap={S.linecap} opacity="0.7" />

        <g className="cover-pivot motion-safe:animate-cover-open">
          <path
            d="M70 84h244a12 12 0 0 1 12 12v128a12 12 0 0 1 -12 12H70a12 12 0 0 1 -12 -12V96a12 12 0 0 1 12 -12z"
            fill={C.leather}
            stroke={C.ink}
            strokeWidth={S.width}
            strokeLinejoin={S.linejoin}
          />
          <path
            d="M76 96h232a8 8 0 0 1 8 8v112a8 8 0 0 1 -8 8H76a8 8 0 0 1 -8 -8V104a8 8 0 0 1 8 -8z"
            fill="none"
            stroke={C.gold}
            strokeWidth="1.5"
            strokeDasharray="6 5"
            opacity="0.85"
          />
          <path
            d="M170 140h60v28h-60z"
            fill={C.gold}
            opacity="0.25"
            stroke={C.gold}
            strokeWidth="1.5"
            strokeLinejoin={S.linejoin}
          />
          <path d="M186 152h28" stroke={C.gold} strokeWidth={S.width} strokeLinecap={S.linecap} />

          <path className="motion-safe:animate-cover-gleam" d="M150 100h8l62 122h-8z" fill={C.cream} opacity="0" />
        </g>
      </g>
    </svg>
  );
}
