import { useCallback, useMemo, useState } from 'react';
import { DEFAULT_MOOD } from '@/constants';
import { moodMeta } from '@/utils';
import type { Mood } from '@/types';

/** Mood selection state for the editor sidebar and the mood picker. */
export function useMood(initial: Mood = DEFAULT_MOOD) {
  const [mood, setMood] = useState<Mood>(initial);

  const meta = useMemo(() => moodMeta(mood), [mood]);

  const select = useCallback((next: Mood) => setMood(next), []);

  const clear = useCallback(() => setMood(DEFAULT_MOOD), []);

  return { mood, meta, select, clear, setMood } as const;
}
