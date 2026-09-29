import type { ReactNode } from 'react';
import { cn } from '@/utils';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: string;
  className?: string;
  children?: ReactNode;
}

/** Dashboard tile used by every stat on the stats page. */
export function StatCard({ label, value, hint, icon, accent = '#C9A961', className, children }: StatCardProps) {
  return (
    <article
      className={cn(
        'flex min-w-0 flex-col gap-2 rounded-lg border border-primary-200/70 bg-accent-cream/95 p-4 shadow-soft',
        'paper-texture dark:border-primary-700 dark:bg-primary-800/70',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="font-body text-xs uppercase tracking-wide text-muted">{label}</h3>
        {icon ? (
          <span aria-hidden="true" style={{ color: accent }}>
            {icon}
          </span>
        ) : null}
      </header>
      <div className="font-display text-3xl text-primary-800 dark:text-primary-100">{value}</div>
      {hint ? <p className="font-body text-xs text-primary-500 dark:text-primary-300">{hint}</p> : null}
      {children}
    </article>
  );
}
