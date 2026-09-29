import { longDateFormatter, shortDateFormatter, timeFormatter } from './formatters.ts';

/**
 * Shared date primitives: parsing, ISO keys and display formatting.
 *
 * These helpers used `date-fns`, which is tree-shakeable but still put a large shared
 * chunk on the first paint: the cover page needs one long date, and every visit paid for
 * the library's parsing and locale machinery. `Intl` is native and ships no bytes.
 */

/** Falls back to today so one unparseable date cannot break every date helper. */
export function safeDate(value: Date | string): Date {
  const parsed = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/** Pads to two digits for ISO output. */
function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** ISO date key (`yyyy-MM-dd`) built from local parts, so no timezone shift creeps in. */
export function toDateKey(value: Date | string): string {
  const date = safeDate(value);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Whole calendar days from `from` to `to`, ignoring the time of day. */
export function calendarDaysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}

/** Human date used on cards and the reader, e.g. "Monday, September 28, 2026". */
export function formatLongDate(value: Date | string): string {
  return longDateFormatter.format(safeDate(value));
}

/** Compact date used in dense lists, e.g. "Sep 28, 2026". */
export function formatShortDate(value: Date | string): string {
  return shortDateFormatter.format(safeDate(value));
}

/** Time of day, e.g. "09:15". */
export function formatTime(value: Date | string): string {
  return timeFormatter.format(safeDate(value));
}
