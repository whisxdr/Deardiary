import type { IconProps } from '@/types/icon';

/** Twin sparkles: full of affection. */
export const AdoringIcon = ({ size = 24, className, color }: IconProps) => (
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
    <path d="M10 3l1.7 4.3L16 9l-4.3 1.7L10 15l-1.7-4.3L4 9l4.3-1.7z" />
    <path d="M17.5 14l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
  </svg>
);
