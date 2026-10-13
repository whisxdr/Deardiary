import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { IconButton } from '@/components/common';

/** Month name alone, e.g. "September". Locale is pinned with the other date helpers. */
const monthNameFormatter = new Intl.DateTimeFormat('en-US', { month: 'long' });

export interface CalendarHeaderProps {
  month: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

/** Almanac masthead: the month set as a printed issue date, with the navigation beside it. */
export function CalendarHeader({ month, onPrevious, onNext, onToday }: CalendarHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b-[3px] border-double border-primary-800 pb-3 dark:border-primary-100">
      <div className="flex flex-col gap-1">
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.22em] text-primary-500 dark:text-primary-300">
          The Almanac of Days
        </p>
        <h2
          className="font-display text-2xl leading-tight tracking-tight text-primary-800 sm:text-3xl dark:text-primary-100"
          aria-live="polite"
        >
          {monthNameFormatter.format(month)}
          <span className="ml-2 font-display text-lg font-medium text-primary-500 italic sm:text-xl dark:text-primary-300">
            {month.getFullYear()}
          </span>
        </h2>
        <span aria-hidden="true" className="mt-1 flex gap-2">
          <span className="h-[3px] w-16 rounded-sm bg-accent-gold" />
          <span className="h-[3px] w-6 rounded-sm bg-accent-sage" />
          <span className="h-[3px] w-2 rounded-sm bg-accent-rose" />
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToday}
          className="flex min-h-[44px] items-center rounded-md border border-primary-200 px-3.5 font-body text-[11px] font-semibold tracking-[0.14em] text-primary-600 uppercase transition-colors duration-fast hover:border-accent-gold hover:bg-accent-gold/12 hover:text-primary-800 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent-gold dark:border-primary-600 dark:text-primary-200 dark:hover:text-primary-100"
        >
          Today
        </button>
        <IconButton label="Previous month" onClick={onPrevious} icon={<CaretLeft size={16} aria-hidden="true" />} />
        <IconButton label="Next month" onClick={onNext} icon={<CaretRight size={16} aria-hidden="true" />} />
      </div>
    </header>
  );
}
