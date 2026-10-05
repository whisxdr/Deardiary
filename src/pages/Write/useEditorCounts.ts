import { useEffect, useRef, useState } from 'react';
import { TIMING } from '@/constants';
import { countCharacters, countWords } from '@/lib';

/**
 * Live word, character and raw-length counters for the editor.
 *
 * `countWords` and `countCharacters` each run a full-body regex, so calling them on every
 * `onUpdate` put a regex pass over the whole entry on the keystroke path. Only the raw
 * HTML length (a plain `.length`, needed for the near-limit warning) is recorded at once;
 * the two regex passes are deferred behind a short idle window, which is invisible for a
 * readout that only has to keep up with a person.
 */
export function useEditorCounts() {
  const [words, setWords] = useState(0);
  const [characters, setCharacters] = useState(0);
  const [contentLength, setContentLength] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  /** Recomputes every counter at once; used when content is loaded, not typed. */
  const measureNow = (html: string) => {
    setWords(countWords(html));
    setCharacters(countCharacters(html));
    setContentLength(html.length);
  };

  /** Records the raw length at once (cheap) and defers the two regex passes. */
  const scheduleMeasure = (html: string) => {
    setContentLength(html.length);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setWords(countWords(html));
      setCharacters(countCharacters(html));
    }, TIMING.counterDebounceMs);
  };

  return { words, characters, contentLength, measureNow, scheduleMeasure } as const;
}
