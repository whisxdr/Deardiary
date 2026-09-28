import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/utils';
import { usePrefersReducedMotion } from '@/hooks';

export interface BookCoverProps {
  children: ReactNode;
  className?: string;
}

/** Leather cover shell with gilt border, spine and a 3D tilt on hover. */
export function BookCover({ children, className }: BookCoverProps) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <motion.div
      className={cn(
        'relative w-full max-w-3xl overflow-hidden rounded-xl border border-primary-800/60',
        'bg-primary-700 shadow-book leather-texture',
        className,
      )}
      initial={{ rotateY: reducedMotion ? 0 : -8, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 1400 }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-6 w-[3px] bg-accent-gold/30" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-3 rounded-lg border border-accent-gold/40"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(26,15,10,0.65)_100%)]"
      />
      <div className="relative z-10 px-8 py-14 text-center sm:px-16 sm:py-20">{children}</div>
    </motion.div>
  );
}
