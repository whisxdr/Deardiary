import { cn } from '@/utils';
import { moodColor, moodLabel } from '@/utils/mood';
import { formatRelativeDay } from '@/utils/calendar';
import type { Mood } from '@/types';

export interface CalendarCellProps {
  date: Date;
  moods: Mood[];
  count: number;
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  /** Short label kept beside the date, e.g. the day's first tag. */
  note?: string;
  onSelect: (date: Date) => void;
}

/**
 * One ruled box of the almanac grid.
 *
 * Set as a printed day box: the date in Playfair, mood dots, the entry count, and a short
 * note beside the date. A day with nothing written carries a hairline across its foot, so
 * an empty day reads as a ruled line waiting for ink rather than a blank grey cell.
 */
export function CalendarCell({
  date,
  moods,
  count,
  isToday,
  isSelected,
  isCurrentMonth,
  note,
  onSelect,
}: CalendarCellProps) {
  const moodSummary = moods.slice(0, 4).map((mood) => moodLabel(mood)).join(', ');
  const overflow = moods.length > 4 ? `, and ${moods.length - 4} more` : '';

  return (
    <button
      type="button"
      onClick={() => onSelect(date)}
      aria-pressed={isSelected}
      aria-label={`${formatRelativeDay(date)}, ${count} ${count === 1 ? 'entry' : 'entries'}${moodSummary ? `, mood ${moodSummary}${overflow}` : ''}`}
      className={cn(
        'relative flex min-h-[92px] flex-col items-center gap-1 border-r border-b border-primary-200/70 p-2 text-left transition-colors duration-fast',
        'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-accent-gold',
        isCurrentMonth ? 'bg-accent-cream/60 dark:bg-primary-800/40' : 'border-transparent bg-transparent opacity-40',
        isSelected && 'bg-accent-gold/10 ring-accent-gold ring-1 ring-inset dark:bg-accent-gold/12',
        isToday && !isSelected && 'bg-accent-gold/16 ring-accent-gold ring-1 ring-inset',
      )}
    >
      <span
        className={cn(
          'font-display text-[19px] leading-none font-bold text-primary-700 dark:text-primary-100',
          (isToday || isSelected) && 'text-accent-gold-deep dark:text-accent-gold',
        )}
      >
        {date.getDate()}
      </span>

      {isToday ? (
        <span className="rounded-full border border-accent-gold px-1.5 py-px font-body text-[9px] font-bold tracking-[0.12em] text-primary-500 uppercase dark:text-primary-300">
          Today
        </span>
      ) : null}

      <span aria-hidden="true" className="flex min-h-[8px] flex-wrap items-center justify-center gap-[3px]">
        {moods.slice(0, 4).map((mood, index) => (
          <span key={`${mood}-${index}`} className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: moodColor(mood) }} />
        ))}
      </span>

      {count > 0 ? (
        <span className="font-mono text-[11px] leading-none text-primary-500 dark:text-primary-300">
          {`${count} ${count === 1 ? 'entry' : 'entries'}`}
        </span>
      ) : null}

      {/*
        The note is a marginal nicety, so it only shows where a cell is wide enough to
        read it; below `sm` it would truncate to a couple of letters.
      */}
      {note ? (
        <span className="hidden max-w-full truncate font-body text-[13px] leading-tight text-primary-600 italic sm:block dark:text-primary-200">{note}</span>
      ) : null}

      {/* A day with no entries still reads as a ruled line waiting for ink. */}
      {count === 0 && isCurrentMonth ? <span aria-hidden="true" className="absolute inset-x-2 bottom-2 h-px bg-primary-200" /> : null}
    </button>
  );
}
