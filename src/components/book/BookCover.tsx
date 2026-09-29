import type { ReactNode } from 'react';
import { cn } from '@/utils';

export interface BookCoverProps {
  children: ReactNode;
  className?: string;
}

/**
 * Leather cover shell with gilt border, spine and a 3D tilt on hover.
 *
 * The opening tilt is a CSS animation rather than a Framer Motion one: this is the first
 * thing painted on the landing page, and importing Framer Motion here pulled the whole
 * animation library into the initial bundle. `motion-safe:` keeps the reduced-motion
 * behaviour the component had.
 */
export function BookCover({ children, className }: BookCoverProps) {
  return (
    <div
      className={cn(
        'relative w-full max-w-3xl overflow-hidden rounded-xl border border-primary-800/60',
        'bg-primary-700 shadow-book leather-texture motion-safe:animate-cover-open',
        className,
      )}
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
    </div>
  );
}
