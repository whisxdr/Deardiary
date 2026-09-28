import { ILLUSTRATION_COLORS as C, ILLUSTRATION_STROKE as S } from './illustrationTheme';
import type { IllustrationProps } from './illustrationTheme';

/** Person scanning a bookshelf: no search results. */
export function EmptySearch({ size = 300, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 400 300"
      fill="none"
      className={className}
      role="img"
      aria-label="A person searching a bookshelf"
    >
      <ellipse cx="200" cy="256" rx="150" ry="12" fill={C.cream} />
      <rect x="52" y="60" width="150" height="180" rx="6" fill={C.paper} stroke={C.leather} strokeWidth={S.width} />
      <path d="M52 120h150M52 180h150" stroke={C.leather} strokeWidth={S.width} />
      <rect x="66" y="78" width="16" height="42" rx="2" fill={C.gold} opacity="0.7" />
      <rect x="88" y="86" width="14" height="34" rx="2" fill={C.leather} opacity="0.5" />
      <rect x="108" y="74" width="18" height="46" rx="2" fill={C.gold} opacity="0.45" />
      <rect x="134" y="90" width="13" height="30" rx="2" fill={C.leather} opacity="0.35" />
      <rect x="66" y="138" width="14" height="42" rx="2" fill={C.leather} opacity="0.45" />
      <rect x="86" y="146" width="18" height="34" rx="2" fill={C.gold} opacity="0.6" />
      <rect x="112" y="134" width="15" height="46" rx="2" fill={C.leather} opacity="0.3" />
      <circle cx="268" cy="112" r="24" fill={C.paper} stroke={C.leather} strokeWidth={S.width} />
      <path d="M262 112a6 6 0 1 0 12 0" stroke={C.ink} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <path d="M268 136v44" stroke={C.leather} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <path d="M268 148l-26 18M268 148l26 18" stroke={C.leather} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <path d="M268 180l-16 46M268 180l16 46" stroke={C.leather} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <circle cx="308" cy="88" r="30" fill="none" stroke={C.gold} strokeWidth={S.width} />
      <path d="M330 110l18 18" stroke={C.gold} strokeWidth={S.width} strokeLinecap={S.linecap} />
    </svg>
  );
}
