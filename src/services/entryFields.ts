import { countWords, readingTimeMinutes } from '@/lib';
import { sanitizeTags, sanitizeTitle } from '@/lib/validate';
import type { Entry } from '@/types';

/** Fills in every derived field an entry needs before it is stored. */
export function withDerivedFields(entry: Entry): Entry {
  const words = countWords(entry.content);
  return {
    ...entry,
    tags: sanitizeTags(entry.tags),
    wordCount: words,
    readingTime: readingTimeMinutes(words),
  };
}

/** Sorts newest first so stored order matches the default dashboard order. */
export function byNewest(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Applies a title patch only when one was supplied. */
export function resolveTitle(patch: Partial<Entry>, current: string): string {
  return patch.title !== undefined ? sanitizeTitle(patch.title) : current;
}
