import { formatShortDate, stripHtml, truncate } from '@/utils';

export { countCharacters, countWords, formatWordCount } from './wordCount';
export { formatReadingTime, readingTimeMinutes } from './readingTime';

/** One-line preview of an entry body. */
export function entryPreview(content: string, max = 160): string {
  const text = stripHtml(content);
  return text ? truncate(text, max) : 'No words yet — the page is still blank.';
}

/** Fallback title for untitled entries, based on the entry date. */
export function entryTitle(title: string, date: string): string {
  return title.trim() || `Entry for ${formatShortDate(date)}`;
}

/** Human-readable byte size for the Data settings section. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Percentage label rounded for stat cards. */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/** Pluralized count label, e.g. "3 entries". */
export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
