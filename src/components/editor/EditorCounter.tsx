import { formatReadingTime, formatWordCount } from '@/lib';

export interface EditorCounterProps {
  words: number;
  characters: number;
}

/** Word, character and reading-time readout below the editor. */
export function EditorCounter({ words, characters }: EditorCounterProps) {
  return (
    <p className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-primary-400 dark:text-primary-300">
      <span>{formatWordCount(words)}</span>
      <span>{`${characters.toLocaleString('en-US')} characters`}</span>
      <span>{formatReadingTime(words)}</span>
    </p>
  );
}
