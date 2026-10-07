import { cn } from '@/utils';
import { usePrefersReducedMotion } from '@/hooks';

export interface BookmarkProps {
  label?: string;
  color?: string;
  className?: string;
  animate?: boolean;
}

/**
 * Ribbon bookmark that hangs from the top edge of a cover or page.
 *
 * A CSS keyframe rather than Framer Motion: the cover renders it on the landing page,
 * which is the first paint for every visitor, and the animation library cost more than
 * the drop it drew. The reduced-motion branch keeps the ribbon visible and still.
 */
export function Bookmark({ label = 'Bookmark', color = '#C9A961', className, animate }: BookmarkProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        'pointer-events-none inline-block h-24 w-6 drop-shadow-soft',
        animate && !reducedMotion && 'animate-bookmark-drop',
        className,
      )}
      style={{ backgroundColor: color, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)' }}
    />
  );
}
