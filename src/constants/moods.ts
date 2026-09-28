import type { MoodMeta } from '@/types';

/** Every mood the picker offers, in display order. */
export const MOODS: MoodMeta[] = [
  { id: 'happy', label: 'Happy', color: '#F4B400', description: 'Light and cheerful' },
  { id: 'sad', label: 'Sad', color: '#5C6BC0', description: 'Heavy-hearted' },
  { id: 'angry', label: 'Angry', color: '#E53935', description: 'Hot under the collar' },
  { id: 'tired', label: 'Tired', color: '#7E57C2', description: 'Running low' },
  { id: 'thoughtful', label: 'Thoughtful', color: '#78909C', description: 'Turning things over' },
  { id: 'loved', label: 'Loved', color: '#EC407A', description: 'Warm and cherished' },
  { id: 'cool', label: 'Cool', color: '#26A69A', description: 'Confident and easy' },
  { id: 'anxious', label: 'Anxious', color: '#FF7043', description: 'On edge' },
  { id: 'excited', label: 'Excited', color: '#FFC107', description: 'Buzzing with energy' },
  { id: 'calm', label: 'Calm', color: '#8A9A5B', description: 'Settled and quiet' },
  { id: 'adoring', label: 'Adoring', color: '#AB47BC', description: 'Full of affection' },
  { id: 'mindblown', label: 'Mind-blown', color: '#FF5722', description: 'Completely amazed' },
];

/** Mood used when a draft has no selection yet. */
export const DEFAULT_MOOD = 'calm' as const;

/** Ink color used by the unselected mood stamps; theme-aware via CSS variable. */
export const MOOD_STAMP_INK = 'var(--mood-stamp-ink)';
