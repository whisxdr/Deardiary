import { ILLUSTRATION_COLORS as C, ILLUSTRATION_STROKE as S } from './illustrationTheme';
import type { IllustrationProps } from './illustrationTheme';

/** Torn page falling out of a book: a route that does not exist. */
export function NotFound({ size = 300, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 400 300"
      fill="none"
      className={className}
      role="img"
      aria-label="A torn page falling from a book"
    >
      <ellipse cx="200" cy="262" rx="140" ry="12" fill={C.cream} />
      <path d="M76 96h150v150H76z" fill={C.paper} stroke={C.leather} strokeWidth={S.width} strokeLinejoin={S.linejoin} />
      <path d="M76 96h150v150H76z" fill={C.leather} opacity="0.08" />
      <path d="M98 130h106M98 154h106M98 178h72" stroke={C.gold} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <path
        d="M256 132l72 22-30 12 18 34-16 8-18-34-26 22z"
        fill={C.paper}
        stroke={C.leather}
        strokeWidth={S.width}
        strokeLinejoin={S.linejoin}
      />
      <path d="M270 148l34 10" stroke={C.gold} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <path d="M252 216l14 18M276 224l10 16M300 232l8 14" stroke={C.leather} strokeWidth={S.width} strokeLinecap={S.linecap} opacity="0.5" />
      <circle cx="200" cy="60" r="18" fill={C.gold} opacity="0.4" />
    </svg>
  );
}
