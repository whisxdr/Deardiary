import type { IconProps } from '@/types/icon';

/** Crescent moon with sleep marks: running low. */
export const TiredIcon = ({ size = 24, className, color }: IconProps) => (
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
    <path d="M20 15.6A8.2 8.2 0 0 1 8.4 4 8.2 8.2 0 1 0 20 15.6z" />
    <path d="M14.6 3.2h2.9l-2.9 2.9h2.9" />
    <path d="M19.4 8.4h2.1l-2.1 2.1h2.1" />
  </svg>
);
