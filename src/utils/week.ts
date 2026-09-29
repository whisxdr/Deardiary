/**
 * Week boundaries.
 *
 * Weeks start on Sunday, matching the calendar grid's header and the weekly statistics
 * buckets. Both ends are built from local date parts so a DST shift cannot move them.
 */

/** Sunday 00:00 of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

/** Saturday 23:59:59.999 of the week containing `date`. */
export function endOfWeek(date: Date): Date {
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 6);
  next.setHours(23, 59, 59, 999);
  return next;
}
