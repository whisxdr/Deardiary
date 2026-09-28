import { cn } from '@/utils';
import type { ReactNode } from 'react';

export interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

/** CSS-only tooltip wrapper for icon buttons. */
export function Tooltip({ label, children, side = 'top', className }: TooltipProps) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-sm bg-primary-800 px-2 py-1',
          'font-body text-[11px] text-accent-cream opacity-0 shadow-soft transition-opacity duration-fast',
          'group-hover:opacity-100 group-focus-within:opacity-100',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
        )}
      >
        {label}
      </span>
    </span>
  );
}
