import { differenceInCalendarDays, format, isSameDay, isValid, parseISO } from 'date-fns';

/** Falls back to today so one unparseable date cannot break every date helper. */
function safeDate(value: Date | string): Date {
  const parsed = typeof value === 'string' ? parseISO(value) : value;
  return isValid(parsed) ? parsed : new Date();
}

/** ISO date key (`yyyy-MM-dd`) for a Date or ISO string. */
export function toDateKey(value: Date | string): string {
  return format(safeDate(value), 'yyyy-MM-dd');
}

/** Human date used on cards and the reader, e.g. "Monday, September 28, 2026". */
export function formatLongDate(value: Date | string): string {
  return format(safeDate(value), 'EEEE, MMMM d, yyyy');
}

/** Compact date used in dense lists, e.g. "Sep 28, 2026". */
export function formatShortDate(value: Date | string): string {
  return format(safeDate(value), 'MMM d, yyyy');
}

/** Time of day, e.g. "09:15". */
export function formatTime(value: Date | string): string {
  return format(safeDate(value), 'HH:mm');
}

/** Relative label such as "Today", "Yesterday" or "4 days ago". */
export function formatRelativeDay(value: Date | string): string {
  const target = safeDate(value);
  const diff = differenceInCalendarDays(new Date(), target);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff === -1) return 'Tomorrow';
  return formatShortDate(target);
}

/** True when two date-ish values fall on the same calendar day. */
export function isSameCalendarDay(a: Date | string, b: Date | string): boolean {
  return isSameDay(safeDate(a), safeDate(b));
}
