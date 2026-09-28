import type { ReactNode } from 'react';
import { cn } from '@/utils';

export interface EmptyStateProps {
  title: string;
  description: string;
  /** Illustration component rendered above the copy. */
  illustration?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Illustrated empty placeholder used by the dashboard, calendar and stats pages. */
export function EmptyState({ title, description, illustration, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-primary-300/70',
        'bg-primary-50/60 px-6 py-12 text-center dark:border-primary-700 dark:bg-primary-800/40',
        className,
      )}
    >
      {illustration ? <div className="max-w-full">{illustration}</div> : null}
      <h3 className="font-display text-lg text-primary-700 dark:text-primary-100">{title}</h3>
      <p className="max-w-sm font-body text-sm text-primary-500 dark:text-primary-300">{description}</p>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
