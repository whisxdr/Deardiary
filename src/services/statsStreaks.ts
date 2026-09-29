import { differenceInCalendarDays, parseISO, subDays } from 'date-fns';
import { toDateKey } from '@/utils';
import type { Entry } from '@/types';

/**
 * Longest run of consecutive days that contain at least one entry, ending today.
 *
 * Steps a calendar day at a time rather than subtracting 24 hours: on the day after a
 * spring-forward, subtracting a fixed day from a local time before 01:00 lands two
 * calendar days back and the loop stops early.
 */
export function computeStreak(entries: Entry[]): number {
  const days = new Set(entries.map((entry) => toDateKey(entry.date)));
  let streak = 0;
  let cursor = new Date();
  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

/** Longest streak anywhere in the collection, not only the current run. */
export function computeLongestStreak(entries: Entry[]): number {
  const keys = Array.from(new Set(entries.map((entry) => toDateKey(entry.date)))).sort();
  let longest = 0;
  let current = 0;
  let previous: string | null = null;
  for (const key of keys) {
    current = previous && differenceInCalendarDays(parseISO(key), parseISO(previous)) === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = key;
  }
  return longest;
}
