import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { IconButton } from '@/components/common';

/** Month label, e.g. "September 2026". Locale is pinned with the other date helpers. */
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

export interface CalendarHeaderProps {
  month: Date;
  summary: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

/** Month navigation with previous, next and jump-to-today controls. */
export function CalendarHeader({ month, summary, onPrevious, onNext, onToday }: CalendarHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl text-primary-800 dark:text-primary-100 sm:text-3xl" aria-live="polite">
          {monthFormatter.format(month)}
        </h2>
        <p className="font-sub text-base text-primary-600 italic dark:text-primary-200">{summary}</p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToday}
          className="cursor-pointer rounded-md px-2 py-1 font-body text-xs text-muted transition-colors duration-fast hover:bg-primary-100/70 dark:hover:bg-primary-700/60"
        >
          Today
        </button>
        <IconButton
          label="Previous month"
          onClick={onPrevious}
          icon={<CaretLeft size={16} aria-hidden="true" />}
        />
        <IconButton label="Next month" onClick={onNext} icon={<CaretRight size={16} aria-hidden="true" />} />
      </div>
    </header>
  );
}
