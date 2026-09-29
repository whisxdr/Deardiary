import { calendarDaysBetween, formatShortDate, safeDate, toDateKey } from './date.ts';

/**
 * Calendar keys, labels and day arithmetic, replacing the date-fns equivalents.
 *
 * Each function works on whole calendar days rather than fixed 24-hour spans: a
 * spring-forward day is 23 hours long, so subtracting 86_400_000ms from a local time
 * before 01:00 lands two calendar days back and skips a day.
 */

/**
 * Parses an ISO string into a Date, returning an invalid Date for bad input.
 *
 * Replaces `parseISO`. Callers test with `Number.isNaN(date.getTime())`.
 */
export function parseDate(value: string): Date {
  return new Date(value);
}

/** Relative label such as "Today", "Yesterday" or "4 days ago". */
export function formatRelativeDay(value: Date | string): string {
  const target = safeDate(value);
  const diff = calendarDaysBetween(target, new Date());
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff === -1) return 'Tomorrow';
  return formatShortDate(target);
}

/** True when two date-ish values fall on the same calendar day. */
export function isSameCalendarDay(a: Date | string, b: Date | string): boolean {
  return toDateKey(a) === toDateKey(b);
}

/** Whole calendar days from `from` to `to`; negative when `to` is earlier. */
export function daysBetweenKeys(from: string, to: string): number {
  return calendarDaysBetween(safeDate(from), safeDate(to));
}
