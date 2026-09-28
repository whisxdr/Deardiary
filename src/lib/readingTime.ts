import { WORDS_PER_MINUTE } from '@/constants';

/** Estimated reading time in whole minutes; short entries still read as 1 minute. */
export function readingTimeMinutes(words: number): number {
  if (words <= 0) return 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Label for the reading time, e.g. "3 min read". */
export function formatReadingTime(words: number): string {
  const minutes = readingTimeMinutes(words);
  if (minutes === 0) return 'No reading time yet';
  return `${minutes} min read`;
}
