import { createIdFrom } from '@/lib/id';
import { countWords, readingTimeMinutes } from '@/lib';
import type { Entry } from '@/types';
import { SEED_SPECS } from './seedSpecs';

/** Builds an ISO timestamp `daysAgo` before today at a fixed hour. */
function timestampFor(daysAgo: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

/** Eight starter entries so the diary is never empty on a first visit. */
export const dummyEntries: Entry[] = SEED_SPECS.map((seed) => {
  const date = timestampFor(seed.daysAgo, seed.hour);
  const words = countWords(seed.content);
  return {
    id: createIdFrom(seed.slug),
    title: seed.title,
    content: seed.content,
    mood: seed.mood,
    tags: seed.tags,
    date,
    createdAt: date,
    updatedAt: date,
    isFavorite: Boolean(seed.isFavorite),
    isPrivate: false,
    location: seed.location,
    wordCount: words,
    readingTime: readingTimeMinutes(words),
  };
});
