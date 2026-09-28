import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/utils';
import { usePrefersReducedMotion } from '@/hooks';

export interface BookFlipProps {
  /** Changing this key replays the flip animation. */
  pageKey: string;
  direction?: 'forward' | 'backward';
  children: ReactNode;
  className?: string;
}

/** Wraps page content in a 3D rotateY flip keyed on the current page. */
export function BookFlip({ pageKey, direction = 'forward', children, className }: BookFlipProps) {
  const reducedMotion = usePrefersReducedMotion();
  const from = direction === 'forward' ? 90 : -90;

  if (reducedMotion) {
    return <div className={cn('relative', className)}>{children}</div>;
  }

  return (
    <motion.div
      key={pageKey}
      className={cn('relative [transform-style:preserve-3d]', className)}
      initial={{ rotateY: from, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      exit={{ rotateY: -from, opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 1600, transformOrigin: direction === 'forward' ? 'left center' : 'right center' }}
    >
      {children}
    </motion.div>
  );
}
