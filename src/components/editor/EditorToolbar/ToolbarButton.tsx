import type { ReactNode } from 'react';
import { cn } from '@/utils';

export interface ToolbarButtonProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  shortcut?: string;
}

/** One editor toolbar control with a tooltip-style title. */
export function ToolbarButton({ label, icon, onClick, active, disabled, shortcut }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-primary-600 transition-colors duration-fast',
        'hover:bg-primary-100 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-accent-gold disabled:opacity-40',
        'dark:text-primary-200 dark:hover:bg-primary-700',
        active && 'bg-accent-gold/30 text-primary-900 dark:text-primary-100',
      )}
    >
      {icon}
    </button>
  );
}
