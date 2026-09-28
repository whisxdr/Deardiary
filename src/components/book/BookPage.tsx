import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/utils';
import { usePrefersReducedMotion } from '@/hooks';

export interface BookPageProps {
  children: ReactNode;
  side?: 'left' | 'right' | 'single';
  className?: string;
  texture?: boolean;
}

/** A single paper page with an optional paper texture and gutter shading. */
export function BookPage({ children, side = 'single', className, texture = true }: BookPageProps) {
  return (
    <div
      className={cn(
        'relative min-h-[24rem] bg-accent-cream px-6 py-8 shadow-medium sm:px-10 sm:py-12',
        'dark:bg-primary-800 dark:text-primary-100',
        texture && 'paper-texture',
        side === 'left' && 'book-page-left rounded-l-lg',
        side === 'right' && 'book-page-right rounded-r-lg',
        side === 'single' && 'rounded-lg',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface BookSpreadProps {
  left: ReactNode;
  right: ReactNode;
  className?: string;
}

/** Two facing pages on desktop, stacked on small screens. */
export function BookSpread({ left, right, className }: BookSpreadProps) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <motion.div
      className={cn('grid gap-0 md:grid-cols-2', className)}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <BookPage side="left">{left}</BookPage>
      <BookPage side="right" className="border-t border-primary-200/60 md:border-l md:border-t-0">
        {right}
      </BookPage>
    </motion.div>
  );
}
