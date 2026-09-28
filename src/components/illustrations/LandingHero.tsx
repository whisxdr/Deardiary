import { ILLUSTRATION_COLORS as C, ILLUSTRATION_STROKE as S } from './illustrationTheme';
import type { IllustrationProps } from './illustrationTheme';

/** Person writing at a desk: the landing cover hero. */
export function LandingHero({ size = 320, className }: IllustrationProps) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 400 300"
      fill="none"
      className={className}
      role="img"
      aria-label="A person writing in a journal at a desk"
    >
      <ellipse cx="200" cy="262" rx="150" ry="12" fill={C.cream} />
      <rect x="46" y="200" width="308" height="12" rx="4" fill={C.leather} opacity="0.5" />
      <path d="M74 212v58M326 212v58" stroke={C.leather} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <path d="M120 200l-18-52h116l-16 52z" fill={C.paper} stroke={C.leather} strokeWidth={S.width} strokeLinejoin={S.linejoin} />
      <path d="M130 168h52M126 184h52" stroke={C.gold} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <circle cx="252" cy="96" r="30" fill={C.paper} stroke={C.leather} strokeWidth={S.width} />
      <path d="M232 88a24 24 0 0 1 40 0" fill={C.leather} opacity="0.55" />
      <path d="M252 126v50" stroke={C.leather} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <path d="M252 140l-40 30M252 140l40 26" stroke={C.leather} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <path d="M212 170l-14 30M292 166l14 34" stroke={C.leather} strokeWidth={S.width} strokeLinecap={S.linecap} />
      <g transform="rotate(18 300 176)">
        <rect x="288" y="128" width="14" height="70" rx="3" fill={C.gold} />
        <path d="M288 198h14l-7 16z" fill={C.leather} />
      </g>
      <path d="M96 66l5 12 13 2-9 9 2 13-11-6-11 6 2-13-9-9 13-2z" fill={C.gold} opacity="0.5" />
      <path d="M334 62l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill={C.gold} opacity="0.35" />
    </svg>
  );
}
