import { ILLUSTRATION_COLORS as C, ILLUSTRATION_STROKE as S } from '@/components/illustrations/illustrationTheme';
import type { IllustrationProps } from '@/components/illustrations/illustrationTheme';
import './inkedSpread.css';

/**
 * Hand-inked spread: three movers, in strict sequence. The quill slides right while
 * `stroke-dashoffset` lays ink beneath it (both keyframed to the same 0/8/45 shape, so
 * the drawn tip never drifts ahead of the nib); the page then turns out on
 * `cubic-bezier(0.55, 0, 1, 0.45)` and home on `cubic-bezier(0.16, 1, 0.3, 1)` in 40% of
 * the outgoing duration — back is always the quicker half.
 */

export function InkedSpreadLoader({ size = 220, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 400 300"
      fill="none"
      className={className}
      role="img"
      aria-label="A diary page being written, then turning"
    >
      {/* Everything inside is decorative; the label above carries the whole description. */}
      <g aria-hidden="true">
        {/* Left page, already ruled. */}
        <path d="M40 70h150v170H40z" fill={C.paper} stroke={C.leather} strokeWidth={S.width} strokeLinejoin={S.linejoin} />
        <path d="M56 88h118" stroke={C.gold} strokeWidth={S.width} strokeLinecap={S.linecap} />

        {/* Ruled squiggles, longest first and shortest last; the fourth is the written line. */}
        <path d="M56 110q10 -6 20 0t20 0t20 0" stroke={C.ink} strokeWidth="2" strokeLinecap={S.linecap} opacity="0.75" />
        <path d="M56 132q10 -6 20 0t20 0" stroke={C.ink} strokeWidth="2" strokeLinecap={S.linecap} opacity="0.75" />
        <path d="M56 154q10 -6 20 0t20 0" stroke={C.ink} strokeWidth="2" strokeLinecap={S.linecap} opacity="0.75" />
        <path
          className="lsr-inked-spread-ink motion-safe:[will-change:stroke-dashoffset]"
          d="M56 176q15 -7 30 0t30 0t30 0t28 0"
          stroke={C.ink}
          strokeWidth="2"
          strokeLinecap={S.linecap}
          opacity="0.75"
        />
        <path d="M56 198q10 -6 14 0t14 0" stroke={C.ink} strokeWidth="2" strokeLinecap={S.linecap} opacity="0.75" />

        {/* Spine. */}
        <path d="M190 62h20v186h-20z" fill={C.ink} opacity="0.92" />

        {/* The fresh right page underneath: what the swipe reveals. */}
        <path d="M210 70h150v170H210z" fill={C.paper} stroke={C.leather} strokeWidth={S.width} strokeLinejoin={S.linejoin} />
        <path d="M226 88h118" stroke={C.gold} strokeWidth={S.width} strokeLinecap={S.linecap} />

        {/* Mover 2: the page that turns across the spine. */}
        <g className="lsr-inked-spread-page motion-safe:[will-change:transform]">
          <path d="M210 70h150v170H210z" fill={C.paper} stroke={C.leather} strokeWidth={S.width} strokeLinejoin={S.linejoin} />
          <path d="M226 88h118" stroke={C.gold} strokeWidth={S.width} strokeLinecap={S.linecap} />
        </g>

        {/* Mover 1: the quill, painted last so it stays above the turning page. */}
        <g className="lsr-inked-spread-quill motion-safe:[will-change:transform]">
          <path d="M96 172l30 -12 -12 30 -8 -8z" fill={C.gold} stroke={C.ink} strokeWidth="1.5" strokeLinejoin={S.linejoin} />
          <path d="M124 161l-13 18" stroke={C.ink} strokeWidth="1" />
        </g>
      </g>
    </svg>
  );
}

export default InkedSpreadLoader;
