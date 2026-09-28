/** Counts words in an HTML or plain-text body. */
export function countWords(input: string): number {
  const text = input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 0;
  return text.split(' ').filter(Boolean).length;
}

/** Counts characters, ignoring markup, for the editor counter. */
export function countCharacters(input: string): number {
  return input.replace(/<[^>]*>/g, '').length;
}

/** Formats a word count for display, e.g. "1,204 words". */
export function formatWordCount(words: number): string {
  return `${words.toLocaleString('en-US')} ${words === 1 ? 'word' : 'words'}`;
}
