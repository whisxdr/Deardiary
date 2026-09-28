import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { cn } from '@/utils';

export interface HeaderSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Search box; the debounce lives in the calling page. */
export function HeaderSearch({
  value,
  onChange,
  placeholder = 'Search your entries',
  className,
}: HeaderSearchProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <MagnifyingGlass size={16} aria-hidden="true" className="absolute left-3 text-primary-300" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search entries"
        className={cn(
          'h-9 w-full rounded-full border border-primary-600/70 bg-primary-800/70 pl-9 pr-8 font-body text-sm',
          'text-primary-50 placeholder:text-primary-300 focus:border-accent-gold focus:outline-none',
          'focus:ring-2 focus:ring-accent-gold/40',
        )}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 text-primary-300 hover:text-accent-cream"
        >
          <X size={14} weight="bold" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
