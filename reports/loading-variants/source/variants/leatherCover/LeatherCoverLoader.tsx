import { ILLUSTRATION_COLORS as C, ILLUSTRATION_STROKE as S } from '@/components/illustrations/illustrationTheme';
import type { IllustrationProps } from '@/components/illustrations/illustrationTheme';
import './leatherCover.css';

/**
 * Warm leather cover — the loading state of a diary being opened.
 *
 * The cover is the mover: it swings open in 2D (translate plus a small rotate about the
 * spine edge, never a 3D `rotateY`) to reveal the page stack, then settles closed. The open
 * accelerates into `cubic-bezier(0.16, 1, 0.3, 1)` so it decelerates into place, and the
 * close resolves in roughly 40% of the opening duration, so the loop never reads as a
 * rewind. One pass is 1.2s — long enough to follow, short enough that a fast route still
 * sees it whole.
 */
export function LeatherCoverLoader({ size = 220, className }: IllustrationProps) {
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
      {/* Decorative by design: the label above is the entire description. */}
      <g aria-hidden="true">
        {/* Static warm vignette behind the book; it never animates. */}
        <ellipse cx="200" cy="150" rx="188" ry="140" fill={C.gold} opacity="0.12" />

        {/* The page stack the cover swings off, deepest sheet first. */}
        <path d="M72 92h280v156H72z" fill={C.cream} stroke={C.leather} strokeWidth="1.5" strokeLinejoin={S.linejoin} />
        <path d="M67 87h280v156H67z" fill={C.cream} stroke={C.leather} strokeWidth="1.5" strokeLinejoin={S.linejoin} />
        <path d="M62 82h280v156H62z" fill={C.paper} stroke={C.leather} strokeWidth={S.width} strokeLinejoin={S.linejoin} />
        <path d="M300 96v128" stroke={C.gold} strokeWidth="1.5" strokeLinecap={S.linecap} opacity="0.7" />

        {/* The mover: the front cover, drawn last so it sits on top of the stack. */}
        <g className="lsr-leather-cover-front motion-safe:[will-change:transform]">
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

          {/* Second mover: the gleam that rises across the cover as it opens. */}
          <path className="lsr-leather-cover-gleam" d="M150 100h8l62 122h-8z" fill={C.cream} opacity="0" />
        </g>
      </g>
    </svg>
  );
}

export default LeatherCoverLoader;
