import { motion } from 'framer-motion';
import { ILLUSTRATION_COLORS as C, ILLUSTRATION_STROKE as S } from './illustrationTheme';
import { usePrefersReducedMotion } from '@/hooks';
import type { IllustrationProps } from './illustrationTheme';

/** Open book with turning pages: the route-chunk loading state. */
export function Loading({ size = 220, className }: IllustrationProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 400 300"
      fill="none"
      className={className}
      role="img"
      aria-label="A book with pages turning"
    >
      <ellipse cx="200" cy="250" rx="130" ry="12" fill={C.cream} />
      <path d="M70 110h120v130H70z" fill={C.paper} stroke={C.leather} strokeWidth={S.width} strokeLinejoin={S.linejoin} />
      <path d="M330 110H210v130h120z" fill={C.paper} stroke={C.leather} strokeWidth={S.width} strokeLinejoin={S.linejoin} />
      <path d="M190 106h20v140h-20z" fill={C.leather} opacity="0.35" />
      <motion.path
        d="M210 110h64v130h-64z"
        fill={C.paper}
        stroke={C.leather}
        strokeWidth={S.width}
        strokeLinejoin={S.linejoin}
        style={{ transformOrigin: '210px 110px', transformBox: 'view-box' }}
        animate={reducedMotion ? undefined : { rotateY: [0, -150, 0] }}
        transition={reducedMotion ? undefined : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <path d="M92 140h76M92 164h76M92 188h52" stroke={C.gold} strokeWidth={S.width} strokeLinecap={S.linecap} />
    </svg>
  );
}
