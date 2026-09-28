import { ILLUSTRATION_COLORS as C, ILLUSTRATION_STROKE as S } from './illustrationTheme';
import type { IllustrationProps } from './illustrationTheme';

/** Bar chart with a rising line: the stats page before any data exists. */
export function EmptyStats({ size = 300, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 400 300"
      fill="none"
      className={className}
      role="img"
      aria-label="An empty bar chart waiting for data"
    >
      <ellipse cx="200" cy="258" rx="146" ry="12" fill={C.cream} />
      <rect x="62" y="56" width="276" height="190" rx="8" fill={C.paper} stroke={C.leather} strokeWidth={S.width} />
      <path d="M96 206h208M96 206V92" stroke={C.leather} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <rect x="120" y="160" width="30" height="46" rx="3" fill={C.gold} opacity="0.45" />
      <rect x="170" y="132" width="30" height="74" rx="3" fill={C.gold} opacity="0.65" />
      <rect x="220" y="104" width="30" height="102" rx="3" fill={C.gold} opacity="0.85" />
      <rect x="270" y="146" width="30" height="60" rx="3" fill={C.leather} opacity="0.35" />
      <path
        d="M120 150l50-24 50-28 50 18"
        stroke={C.leather}
        strokeWidth={S.width}
        strokeLinecap={S.linecap}
        strokeDasharray="6 6"
      />
      <circle cx="120" cy="150" r="5" fill={C.leather} />
      <circle cx="220" cy="98" r="5" fill={C.leather} />
    </svg>
  );
}
