import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';
import { shortId } from '@/lib/id';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

/** Text input with optional label, hint, error message and icon slots. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, leading, trailing, id, ...props }, ref) => {
    const inputId = id ?? shortId('input');
    return (
      <div className="flex w-full flex-col gap-1">
        {label ? (
          <label htmlFor={inputId} className="font-body text-xs font-medium uppercase tracking-wide text-muted">
            {label}
          </label>
        ) : null}
        <div className="relative flex items-center">
          {leading ? <span className="absolute left-3 text-muted">{leading}</span> : null}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            aria-describedby={hint || error ? `${inputId}-description` : undefined}
            className={cn(
              'h-10 w-full rounded-md border border-primary-200 bg-primary-50/80 px-3 font-body text-sm text-primary-800',
              'placeholder:text-muted focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/40',
              'dark:border-primary-700 dark:bg-primary-800/60 dark:text-primary-100',
              leading && 'pl-9',
              trailing && 'pr-9',
              error && 'border-error focus:border-error focus:ring-error/30',
              className,
            )}
            {...props}
          />
          {trailing ? <span className="absolute right-3 text-muted">{trailing}</span> : null}
        </div>
        {error || hint ? (
          <p
            id={`${inputId}-description`}
            className={cn('font-body text-xs', error ? 'text-error' : 'text-muted')}
          >
            {error ?? hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
