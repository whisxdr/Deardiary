import { cn } from '@/utils';
import { shortId } from '@/lib/id';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

/** Switch control used by the settings sections. */
export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  const id = shortId('toggle');
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="flex flex-col">
        <label htmlFor={id} className="font-body text-sm font-medium text-primary-700 dark:text-primary-100">
          {label}
        </label>
        {description ? (
          <span className="font-body text-xs text-primary-400 dark:text-primary-300">{description}</span>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-fast focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 disabled:opacity-50',
          checked ? 'bg-accent-gold' : 'bg-primary-200 dark:bg-primary-700',
        )}
      >
        <span
          className={cn(
            'absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform duration-fast',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}
