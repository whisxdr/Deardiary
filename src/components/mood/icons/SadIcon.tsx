import type { IconProps } from '@/types/icon';

/** Falling raindrop: heavy-hearted, low. */
export const SadIcon = ({ size = 24, className, color }: IconProps) => (
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
    <path d="M12 3.5c3.3 4 5.5 6.9 5.5 9.6a5.5 5.5 0 0 1-11 0c0-2.7 2.2-5.6 5.5-9.6z" />
    <path d="M9.6 13.4a2.6 2.6 0 0 0 2.6 2.6" />
  </svg>
);
