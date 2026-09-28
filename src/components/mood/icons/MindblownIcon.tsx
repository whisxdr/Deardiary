import type { IconProps } from '@/types/icon';

/** Burst with radiating spokes: completely amazed. */
export const MindblownIcon = ({ size = 24, className, color }: IconProps) => (
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
    <path d="M12 4.5l1.6 3.2 3.4-1.2-1.2 3.4 3.2 1.6-3.2 1.6 1.2 3.4-3.4-1.2L12 19.5l-1.6-3.2-3.4 1.2 1.2-3.4L5 12.5l3.2-1.6L7 7.5l3.4 1.2z" />
    <path d="M12 2v1M12 21v1M2 12h1M21 12h1" />
  </svg>
);
