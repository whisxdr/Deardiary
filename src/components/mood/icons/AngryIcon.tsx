import type { IconProps } from '@/types/icon';

/** Flame with a hot core: friction, heat. */
export const AngryIcon = ({ size = 24, className, color }: IconProps) => (
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
    <path d="M12 21a6 6 0 0 0 6-6c0-3.6-3-6.6-6-12.5C9 8.4 6 11.4 6 15a6 6 0 0 0 6 6z" />
    <path d="M12 21a2.4 2.4 0 0 0 2.4-2.4c0-1.6-1.2-2.9-2.4-4.7-1.2 1.8-2.4 3.1-2.4 4.7A2.4 2.4 0 0 0 12 21z" />
  </svg>
);
