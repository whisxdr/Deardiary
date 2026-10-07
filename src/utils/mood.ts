import { DEFAULT_MOOD, MOODS } from '@/constants';
import type { Mood, MoodMeta } from '@/types';

const FALLBACK: MoodMeta = {
  id: DEFAULT_MOOD,
  label: 'Calm',
  color: '#8A9A5B',
  description: 'Settled and quiet',
};

/** Metadata for a mood id, falling back to a neutral mood for unknown values. */
export function moodMeta(mood: Mood | string | undefined): MoodMeta {
  if (!mood) return FALLBACK;
  return MOODS.find((item) => item.id === mood) ?? FALLBACK;
}

/** Label for a mood id, e.g. "Thoughtful". */
export function moodLabel(mood: Mood | string | undefined): string {
  return moodMeta(mood).label;
}

/** Hex color for a mood id, used by stamps, dots and chart segments. */
export function moodColor(mood: Mood | string | undefined): string {
  return moodMeta(mood).color;
}
