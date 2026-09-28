import { differenceInCalendarDays, format, isSameDay, parseISO } from 'date-fns';

/** ISO date key (`yyyy-MM-dd`) for a Date or ISO string. */
export function toDateKey(value: Date | string): string {
  return format(typeof value === 'string' ? parseISO(value) : value, 'yyyy-MM-dd');
}

/** Human date used on cards and the reader, e.g. "Monday, September 28, 2026". */
export function formatLongDate(value: Date | string): string {
  return format(typeof value === 'string' ? parseISO(value) : value, 'EEEE, MMMM d, yyyy');
}

/** Compact date used in dense lists, e.g. "Sep 28, 2026". */
export function formatShortDate(value: Date | string): string {
  return format(typeof value === 'string' ? parseISO(value) : value, 'MMM d, yyyy');
}

/** Time of day, e.g. "09:15". */
export function formatTime(value: Date | string): string {
  return format(typeof value === 'string' ? parseISO(value) : value, 'HH:mm');
}

/** Relative label such as "Today", "Yesterday" or "4 days ago". */
export function formatRelativeDay(value: Date | string): string {
  const target = typeof value === 'string' ? parseISO(value) : value;
  const diff = differenceInCalendarDays(new Date(), target);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff === -1) return 'Tomorrow';
  return formatShortDate(target);
}

/** True when two date-ish values fall on the same calendar day. */
export function isSameCalendarDay(a: Date | string, b: Date | string): boolean {
  const left = typeof a === 'string' ? parseISO(a) : a;
  const right = typeof b === 'string' ? parseISO(b) : b;
  return isSameDay(left, right);
}

/** Milliseconds between two ISO timestamps, guarded against bad input. */
export function minutesBetween(from: string, to: string): number {
  const start = parseISO(from).getTime();
  const end = parseISO(to).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 60_000));
}
