import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils';
import { shortId } from '@/lib/id';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

/** Multi-line input styled to match the paper surface. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const textareaId = id ?? shortId('textarea');
    return (
      <div className="flex w-full flex-col gap-1">
        {label ? (
          <label
            htmlFor={textareaId}
            className="font-body text-xs font-medium uppercase tracking-wide text-muted"
          >
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={Boolean(error)}
          className={cn(
            'w-full rounded-md border border-primary-200 bg-primary-50/80 p-3 font-body text-sm leading-relaxed',
            'text-primary-800 placeholder:text-muted focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/40',
            'dark:border-primary-700 dark:bg-primary-800/60 dark:text-primary-100',
            error && 'border-error',
            className,
          )}
          {...props}
        />
        {error || hint ? (
          <p className={cn('font-body text-xs', error ? 'text-error' : 'text-muted')}>{error ?? hint}</p>
        ) : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
