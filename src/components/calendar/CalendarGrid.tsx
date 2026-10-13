import { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, endOfWeek, isSameCalendarDay, startOfMonth, startOfWeek, toDateKey } from '@/utils';
import { CalendarCell } from './CalendarCell';
import { CalendarWeekdays } from './CalendarWeekdays';
import type { Entry } from '@/types';

export interface CalendarGridProps {
  month: Date;
  entries: Entry[];
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

/** Seven-column month grid with a mood dot per entry. */
export function CalendarGrid({ month, entries, selectedDate, onSelect }: CalendarGridProps) {
  const days = useMemo(
    () => eachDayOfInterval(startOfWeek(startOfMonth(month)), endOfWeek(endOfMonth(month))),
    [month],
  );

  const byDay = useMemo(
    () =>
      entries.reduce<Record<string, Entry[]>>((acc, entry) => {
        const key = toDateKey(entry.date);
        (acc[key] ??= []).push(entry);
        return acc;
      }, {}),
    [entries],
  );

  return (
    <div className="flex flex-col gap-1.5" role="grid" aria-label="Month grid">
      <CalendarWeekdays />
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const key = toDateKey(day);
          const dayEntries = byDay[key] ?? [];
          return (
            <CalendarCell
              key={key}
              date={day}
              moods={dayEntries.map((entry) => entry.mood)}
              count={dayEntries.length}
              isToday={isSameCalendarDay(day, new Date())}
              isSelected={isSameCalendarDay(day, selectedDate)}
              isCurrentMonth={day.getMonth() === month.getMonth()}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
}
