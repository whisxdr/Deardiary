import { motion } from 'framer-motion';
import { cn } from '@/utils';
import { usePrefersReducedMotion } from '@/hooks';

export interface BookmarkProps {
  label?: string;
  color?: string;
  className?: string;
  animate?: boolean;
}

/** Ribbon bookmark that hangs from the top edge of a cover or page. */
export function Bookmark({ label = 'Bookmark', color = '#C9A961', className, animate }: BookmarkProps) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <motion.span
      aria-label={label}
      title={label}
      className={cn('pointer-events-none inline-block h-24 w-6 drop-shadow-soft', className)}
      style={{ backgroundColor: color, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)' }}
      initial={{ y: reducedMotion || !animate ? 0 : -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.7, ease: [0.68, -0.55, 0.265, 1.55] }}
    />
  );
}
