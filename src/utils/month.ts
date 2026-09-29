/**
 * Month boundaries, used by the calendar grid and the monthly statistics.
 *
 * Built from local date parts rather than a fixed millisecond span, so a DST shift cannot
 * move a boundary to the wrong day.
 */

/** First day of the month at 00:00. */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Last day of the month at 23:59:59.999. */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/** Every calendar day from `start` to `end` inclusive, at local midnight. */
export function eachDayOfInterval(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cursor.getTime() <= last.getTime()) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/** Steps a date back by whole calendar days, immune to DST hour shifts. */
export function subDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

/** Adds whole months, clamping the day to the target month's length. */
export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  const targetDay = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(targetDay, lastDay));
  return next;
}
