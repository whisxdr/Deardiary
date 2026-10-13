import { WEEKDAYS } from '@/constants';

/** Weekday header row above the month grid. */
export function CalendarWeekdays() {
  return (
    <div className="grid grid-cols-7 gap-1.5" role="row">
      {WEEKDAYS.map((day) => (
        <span
          key={day}
          role="columnheader"
          className="pb-1 text-center font-body text-[11px] uppercase tracking-wide text-muted"
        >
          <span aria-hidden="true">{day.slice(0, 3)}</span>
          <span className="sr-only">{day}</span>
        </span>
      ))}
    </div>
  );
}
