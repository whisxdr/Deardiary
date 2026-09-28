import type { IconProps } from '@/types/icon';

/** Uneven waves: on edge, unsettled. */
export const AnxiousIcon = ({ size = 24, className, color }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color ?? 'currentColor'}
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 9.5c1.8-2 3.2-2 4.5 0s2.7 2 4.5 0 3.2-2 4.5 0 2.7 2 4.5 0" />
    <path d="M3 14.5c1.4-1.6 2.6-1.6 3.6 0s2.2 1.6 3.6 0 2.6-1.6 3.6 0 2.2 1.6 3.6 0 2.6-1.6 3.6 0" />
  </svg>
);
