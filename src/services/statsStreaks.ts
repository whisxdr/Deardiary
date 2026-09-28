import { differenceInCalendarDays, parseISO } from 'date-fns';
import { toDateKey } from '@/utils';
import type { Entry } from '@/types';

/** Longest run of consecutive days that contain at least one entry, ending today. */
export function computeStreak(entries: Entry[]): number {
  const days = new Set(entries.map((entry) => toDateKey(entry.date)));
  let streak = 0;
  let cursor = new Date();
  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
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
