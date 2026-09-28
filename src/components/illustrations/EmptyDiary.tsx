import { ILLUSTRATION_COLORS as C, ILLUSTRATION_STROKE as S } from './illustrationTheme';
import type { IllustrationProps } from './illustrationTheme';

/** Open journal with blank lines: the dashboard before the first entry. */
export function EmptyDiary({ size = 300, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 400 300"
      fill="none"
      className={className}
      role="img"
      aria-label="An open journal with blank pages"
    >
      <ellipse cx="200" cy="252" rx="140" ry="14" fill={C.cream} />
      <path d="M60 90h130v150H60z" fill={C.paper} stroke={C.leather} strokeWidth={S.width} strokeLinejoin={S.linejoin} />
      <path d="M340 90H210v150h130z" fill={C.paper} stroke={C.leather} strokeWidth={S.width} strokeLinejoin={S.linejoin} />
      <path d="M190 84h20v162h-20z" fill={C.leather} opacity="0.35" />
      <path d="M60 90h130v150H60z" fill={C.leather} opacity="0.06" />
      <path d="M84 122h84M84 144h84M84 166h56" stroke={C.gold} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <path d="M232 122h84M232 144h84M232 166h56" stroke={C.gold} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <path
        d="M300 58l6 14 15 2-11 10 3 15-13-7-13 7 3-15-11-10 15-2z"
        fill={C.gold}
        opacity="0.55"
      />
    </svg>
  );
}
