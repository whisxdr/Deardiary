import { ILLUSTRATION_COLORS as C, ILLUSTRATION_STROKE as S } from '@/components/illustrations/illustrationTheme';
import type { IllustrationProps } from '@/components/illustrations/illustrationTheme';
import './paperStack.css';

/**
 * Layered paper stack — the route-chunk loading state of a diary mid-turn.
 *
 * Two things move: the top sheet of the right stack, and the gold ribbon hanging off it.
 * The sheet lifts, accelerates across the gutter, then decelerates into the left stack with
 * `cubic-bezier(0.16, 1, 0.3, 1)` so the landing settles instead of stopping; the jump back
 * to its origin is hidden inside a transparent window that resolves in ~96ms against the
 * ~408ms entrance, so the loop reads as a fresh sheet rather than a rewind. One pass is
 * 1.2s — long enough to follow, short enough that a fast route still sees it whole.
 */

export function PaperStackLoader({ size = 220, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 400 300"
      fill="none"
      className={className}
      role="img"
      aria-label="A fresh sheet of paper lifting off one stack and settling on the opposite stack"
    >
      {/* Decorative by design: the label above is the entire description. */}
      <g aria-hidden="true">
        {/* Static floor shadow; ink at low opacity so it reads on night as well as paper. */}
        <ellipse cx="200" cy="224" rx="176" ry="14" fill={C.ink} opacity="0.1" />
        <ellipse cx="200" cy="222" rx="128" ry="9" fill={C.ink} opacity="0.12" />

        {/* Left stack: four lower sheets peek past the top page, edges graded by depth. */}
        <path d="M42 64h148v146H42z" fill="none" stroke={C.ink} strokeWidth="1.5" opacity="0.14" />
        <path d="M46 67h144v143H46z" fill="none" stroke={C.ink} strokeWidth="1.5" opacity="0.18" />
        <path d="M50 70h140v140H50z" fill="none" stroke={C.ink} strokeWidth="1.5" opacity="0.22" />
        <path d="M54 73h136v137H54z" fill="none" stroke={C.ink} strokeWidth="1.5" opacity="0.26" />
        <path
          d="M58 76h132v134H58z"
          fill={C.paper}
          stroke={C.leather}
          strokeWidth={S.width}
          strokeLinejoin={S.linejoin}
        />
        <path
          d="M74 94h100M74 110h100M74 126h100M74 142h68"
          stroke={C.gold}
          strokeWidth={S.width}
          strokeLinecap={S.linecap}
          opacity="0.9"
        />

        {/* Gutter: the dark spine strip the two stacks meet over. */}
        <path d="M190 72h20v142h-20z" fill={C.ink} opacity="0.92" />
        <path d="M200 78v136" stroke={C.cream} strokeWidth="2" opacity="0.2" />

        {/* Right stack: its top sheet is the mover, so only four edges are drawn here. */}
        <path d="M210 64h148v146H210z" fill="none" stroke={C.ink} strokeWidth="1.5" opacity="0.14" />
        <path d="M210 67h144v143H210z" fill="none" stroke={C.ink} strokeWidth="1.5" opacity="0.18" />
        <path d="M210 70h140v140H210z" fill="none" stroke={C.ink} strokeWidth="1.5" opacity="0.22" />
        <path d="M210 73h136v137H210z" fill="none" stroke={C.ink} strokeWidth="1.5" opacity="0.26" />

        {/* Second mover: the ribbon, swinging against the sheet's travel. */}
        <g className="lsr-paper-stack-ribbon motion-safe:[will-change:transform]">
          <path
            d="M304 210h20v32l-10 12-10-12z"
            fill={C.gold}
            stroke={C.ink}
            strokeWidth="1.5"
            strokeLinejoin={S.linejoin}
          />
          <path d="M308 216v26" stroke={C.cream} strokeWidth="1.5" opacity="0.3" strokeLinecap={S.linecap} />
        </g>

        {/* The mover: a blank sheet, so its landing visibly covers the written page. */}
        <g className="lsr-paper-stack-sheet motion-safe:[will-change:transform]">
          <path
            d="M210 76h132v134h-132z"
            fill={C.paper}
            stroke={C.leather}
            strokeWidth={S.width}
            strokeLinejoin={S.linejoin}
          />
          <path d="M222 84h108" stroke={C.ink} strokeWidth="1.5" opacity="0.12" strokeLinecap={S.linecap} />
        </g>
      </g>
    </svg>
  );
}

export default PaperStackLoader;
