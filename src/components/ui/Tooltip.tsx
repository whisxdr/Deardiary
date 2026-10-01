import { cn } from '@/utils';
import type { ReactNode } from 'react';

export interface TooltipProps {
  label: string;
  children: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

/**
 * CSS-only tooltip wrapper for icon buttons.
 *
 * `relative` is applied only when the caller does not position the wrapper itself.
 * Tailwind emits `.fixed` before `.relative`, so a caller passing `fixed` had its
 * positioning silently overridden and the floating write button scrolled with the page
 * instead of staying on screen.
 */
export function Tooltip({ label, children, side = 'top', className }: TooltipProps) {
  const positioned = /(^|\s)(fixed|absolute|sticky|static)(\s|$)/.test(className ?? '');
  return (
    <span className={cn('group inline-flex', !positioned && 'relative', className)}>
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
