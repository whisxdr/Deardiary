import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { IconButton } from '@/components/common';

/** Month label, e.g. "September 2026". Locale is pinned with the other date helpers. */
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

export interface CalendarHeaderProps {
  month: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

/** Month navigation with previous, next and jump-to-today controls. */
export function CalendarHeader({ month, onPrevious, onNext, onToday }: CalendarHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-xl text-primary-800 dark:text-primary-100" aria-live="polite">
        {monthFormatter.format(month)}
      </h2>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToday}
          className="rounded-md px-2 py-1 font-body text-xs text-muted transition-colors duration-fast hover:bg-primary-100/70 dark:hover:bg-primary-700/60"
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
