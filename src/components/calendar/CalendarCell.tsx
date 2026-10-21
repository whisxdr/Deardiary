import { cn } from '@/utils';
import { moodColor } from '@/utils/mood';
import { formatRelativeDay } from '@/utils/calendar';
import type { Mood } from '@/types';

export interface CalendarCellProps {
  date: Date;
  moods: Mood[];
  count: number;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  onSelect: (date: Date) => void;
}

/** One day in the month grid, showing up to four mood dots. */
export function CalendarCell({
  date,
  moods,
  count,
  isToday,
  isSelected,
  isCurrentMonth,
  onSelect,
}: CalendarCellProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      aria-pressed={isSelected}
      aria-label={`${formatRelativeDay(date)}, ${count} ${count === 1 ? 'entry' : 'entries'}`}
      className={cn(
        'flex h-[4.5rem] cursor-pointer flex-col items-start rounded-md border p-1.5 text-left transition-all duration-fast sm:h-20 sm:p-2',
        'hover:border-primary-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold',
        'dark:hover:border-primary-500',
        isCurrentMonth
          ? 'border-primary-200 bg-accent-cream/80 dark:border-primary-700 dark:bg-primary-800/60'
          : 'border-transparent bg-transparent opacity-40',
        isSelected && 'border-accent-gold shadow-soft ring-1 ring-accent-gold',
        isToday && !isSelected && 'border-primary-400',
      )}
    >
      <span
        className={cn(
          'font-mono text-xs text-primary-600 dark:text-primary-200',
          isToday && 'rounded-sm bg-primary-700 px-1 text-accent-cream',
        )}
      >
        {date.getDate()}
      </span>
      {count > 0 ? (
        <span className="mt-auto flex w-full items-center justify-between gap-1">
          <span className="flex flex-wrap items-center gap-0.5">
            {moods.slice(0, 4).map((mood, index) => (
              <span
                key={`${mood}-${index}`}
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: moodColor(mood) }}
              />
            ))}
          </span>
          <span aria-hidden="true" className="font-mono text-[10px] text-muted">
            {count}
          </span>
        </span>
      ) : null}
    </button>
  );
}
