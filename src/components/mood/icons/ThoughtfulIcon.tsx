import type { IconProps } from '@/types/icon';

/** Cloud with a thought bubble: turning things over. */
export const ThoughtfulIcon = ({ size = 24, className, color }: IconProps) => (
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
    <path d="M7.5 16.5a3.5 3.5 0 0 1-.4-7A4.5 4.5 0 0 1 15.6 8a3.8 3.8 0 0 1 .4 8.5z" />
    <path d="M9 20h.01M13 20.6h.01M11 22.4h.01" />
  </svg>
);
