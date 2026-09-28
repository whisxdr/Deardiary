import type { IconProps } from '@/types/icon';

/** Leaf with a vein: settled and quiet. */
export const CalmIcon = ({ size = 24, className, color }: IconProps) => (
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
    <path d="M20 4c0 8.5-4.5 13-11.5 13H5.5C5.5 9 10 4.5 20 4z" />
    <path d="M5.5 17c1.5-3 4-5.5 7.5-7.5" />
  </svg>
);
