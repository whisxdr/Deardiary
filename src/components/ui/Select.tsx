import { cn } from '@/utils';
import type { ReactNode, SelectHTMLAttributes } from 'react';
import { useId } from 'react';
import type { SelectOption } from '@/types';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  options: SelectOption[];
  leading?: ReactNode;
}

/** Native select styled to match the paper surface, used by toolbar filters. */
export function Select({ label, options, leading, className, id, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className="flex items-center gap-2">
      {label ? (
        <label htmlFor={selectId} className="font-body text-xs uppercase tracking-wide text-muted">
          {label}
        </label>
      ) : null}
      {leading}
      <select
        id={selectId}
        className={cn(
          'h-9 rounded-md border border-primary-200 bg-primary-50/80 px-2 font-body text-xs text-primary-700',
          'focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/40',
          'dark:border-primary-700 dark:bg-primary-800/60 dark:text-primary-100',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
