import { WEEKDAYS } from '@/constants';
import { cn } from '@/utils';

/** Weekday header row above the month grid, set in small caps like a printed calendar. */
export function CalendarWeekdays() {
  return (
    <div className="grid grid-cols-7 gap-1.5 border-b border-primary-800 pb-1.5 dark:border-primary-100" role="row">
      {WEEKDAYS.map((day, index) => {
        const isWeekend = index === 0 || index === WEEKDAYS.length - 1;
        return (
          <span
            key={day}
            role="columnheader"
            className={cn(
              'text-center font-body text-[12px] font-semibold tracking-[0.08em] text-primary-600 uppercase dark:text-primary-200',
              isWeekend && 'font-normal tracking-normal text-primary-500 italic normal-case dark:text-primary-300',
            )}
          >
            {day}
          </span>
        );
      })}
    </div>
  );
}
