import { ILLUSTRATION_COLORS as C, ILLUSTRATION_STROKE as S } from './illustrationTheme';
import type { IllustrationProps } from './illustrationTheme';

/** Empty wall calendar with a pencil: a month with no entries. */
export function EmptyCalendar({ size = 300, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 400 300"
      fill="none"
      className={className}
      role="img"
      aria-label="An empty calendar beside a pencil"
    >
      <ellipse cx="190" cy="258" rx="140" ry="12" fill={C.cream} />
      <rect x="58" y="70" width="220" height="170" rx="8" fill={C.paper} stroke={C.leather} strokeWidth={S.width} />
      <path d="M58 112h220" stroke={C.leather} strokeWidth={S.width} />
      <path d="M98 54v34M238 54v34" stroke={C.leather} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <circle cx="98" cy="54" r="7" fill={C.gold} />
      <circle cx="238" cy="54" r="7" fill={C.gold} />
      <path
        d="M84 136h34M130 136h34M176 136h34M222 136h34M84 172h34M130 172h34M176 172h34M222 172h34M84 208h34M130 208h34"
        stroke={C.gold}
        strokeWidth={S.width}
        strokeLinecap={S.linecap}
        opacity="0.75"
      />
      <g transform="rotate(-28 310 190)">
        <rect x="292" y="120" width="26" height="104" rx="4" fill={C.gold} />
        <path d="M292 224h26l-13 22z" fill={C.leather} />
        <path d="M292 136h26" stroke={C.paper} strokeWidth={S.width} />
      </g>
    </svg>
  );
}
