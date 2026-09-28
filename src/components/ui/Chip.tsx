import { X } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '@/utils';

export interface ChipProps {
  children: ReactNode;
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

const BASE =
  'inline-flex items-center gap-1 rounded-full border px-3 py-1 font-body text-xs transition-colors duration-fast';

/** Small rounded label used for tags, moods and filters. */
export function Chip({ children, onRemove, onClick, active, className }: ChipProps) {
  const classes = cn(
    BASE,
    'border-primary-200 bg-primary-100/70 text-primary-600',
    'dark:border-primary-700 dark:bg-primary-800/70 dark:text-primary-200',
    onClick && 'hover:border-accent-gold hover:text-primary-800',
    active && 'border-accent-gold bg-accent-gold/25 text-primary-800 dark:text-primary-100',
    className,
  );

  const removeButton = onRemove ? (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onRemove();
      }}
      aria-label="Remove"
      className="rounded-full p-0.5 hover:bg-primary-200/70"
    >
      <X size={14} weight="bold" aria-hidden="true" />
    </button>
  ) : null;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {children}
        {removeButton}
      </button>
    );
  }

  return (
    <span className={classes}>
      {children}
      {removeButton}
    </span>
  );
}
