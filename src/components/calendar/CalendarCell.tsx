import { cn } from '@/utils';
import { moodColor } from '@/utils/mood';
import { formatRelativeDay } from '@/utils/date';
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
        'flex h-20 flex-col items-start justify-between rounded-md border p-1.5 text-left transition-all duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold',
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
      <span className="flex flex-wrap items-center gap-0.5">
        {moods.slice(0, 4).map((mood, index) => (
          <span
            key={`${mood}-${index}`}
            title={mood}
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: moodColor(mood) }}
          />
        ))}
      </span>
      {count > 0 ? (
        <span className="font-body text-[10px] text-muted">
          {`${count} ${count === 1 ? 'entry' : 'entries'}`}
          <span className="sr-only">{`First mood: ${moods[0]}`}</span>
        </span>
      ) : null}
    </button>
  );
}
