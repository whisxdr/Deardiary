import { MOODS } from '@/constants';

/**
 * Names every mood beside its dot, so the grid's colour is never the only channel.
 */
export function CalendarMoodKey() {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5" aria-label="Mood key">
      {MOODS.map((mood) => (
        <span key={mood.id} className="flex items-center gap-1.5 font-body text-[12px] text-primary-600 dark:text-primary-200">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: mood.color }} />
          {mood.label}
        </span>
      ))}
    </div>
  );
}
