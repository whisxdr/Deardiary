import { useMemo } from 'react';
import { MOODS } from '@/constants';
import { eachDayOfInterval, endOfMonth, endOfWeek, isSameCalendarDay, startOfMonth, startOfWeek, toDateKey } from '@/utils';
import { CalendarCell } from './CalendarCell';
import { CalendarWeekdays } from './CalendarWeekdays';
import type { Entry, Mood } from '@/types';

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

  const monthMoods = useMemo(() => {
    const used = new Set<Mood>();
    days.forEach((day) => {
      byDay[toDateKey(day)]?.forEach((entry) => used.add(entry.mood));
    });
    return MOODS.filter((mood) => used.has(mood.id));
  }, [byDay, days]);

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
      {monthMoods.length > 0 ? (
        <ul aria-label="Moods this month" className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-0.5">
          {monthMoods.map((mood) => (
            <li key={mood.id} className="flex items-center gap-1.5 font-body text-[11px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: mood.color }} />
              {mood.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
