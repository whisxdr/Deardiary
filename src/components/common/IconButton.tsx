import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name; also used as the tooltip text by callers. */
  label: string;
  icon: ReactNode;
  active?: boolean;
  size?: 'sm' | 'md';
}

/** Square icon-only button used in toolbars and headers. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, icon, active, size = 'md', className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-primary-600 transition-colors duration-fast',
        'hover:bg-primary-100/70 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-accent-gold disabled:opacity-50 dark:text-primary-200 dark:hover:bg-primary-700/60',
        size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
        active && 'bg-accent-gold/25 text-primary-800 dark:text-primary-100',
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  ),
);

IconButton.displayName = 'IconButton';
