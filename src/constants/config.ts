import type { SelectOption } from '@/types';
import { MOODS } from './moods';

/** App-level metadata surfaced in the UI and the About section. */
export const APP_CONFIG = {
  name: 'DearDiary',
  tagline: 'Every page is your story',
  version: '1.0.0',
  author: 'DearDiary Studio',
  repository: 'https://github.com/deardiary/deardiary',
} as const;

/** Sort options offered by the dashboard toolbar. */
export const SORT_OPTIONS: SelectOption[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'mood', label: 'Mood' },
];

/** Mood filter options, including the "any mood" reset entry. */
export const MOOD_FILTER_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'All moods' },
  ...MOODS.map((mood) => ({ value: mood.id, label: mood.label })),
];

/** Weekday labels for the calendar grid, starting on Sunday. */
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Reading speed used to estimate how long an entry takes to read. */
export const WORDS_PER_MINUTE = 200;

/** Entries seeded on first visit so the app is never empty on a demo. */
export const SEED_ON_FIRST_VISIT = true;
