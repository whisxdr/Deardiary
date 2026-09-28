import type { IconProps } from '@/types/icon';

/** Lightning bolt: buzzing with energy. */
export const ExcitedIcon = ({ size = 24, className, color }: IconProps) => (
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
    <path d="M13.5 2.5L5.5 13.5h5l-1 8 9-11.5h-5.5z" />
  </svg>
);
