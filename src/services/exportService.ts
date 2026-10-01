import { APP_CONFIG, BACKUP_VERSION } from '@/constants';
import { formatLongDate } from '@/utils';
import { htmlToMarkdown, htmlToText } from '@/lib/parse';
import { loadSettings } from './settingsService';
import type { Entry } from '@/types';

/** Triggers a browser download for generated text. */
export function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking immediately can cancel the download before it starts; defer a tick.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Builds the plain-text rendering of an entry. */
export function entryAsText(entry: Entry): string {
  return [
    entry.title,
    formatLongDate(entry.date),
    entry.location ? `Location: ${entry.location}` : '',
    `Mood: ${entry.mood}`,
    entry.tags.length ? `Tags: ${entry.tags.join(', ')}` : '',
    '',
    htmlToText(entry.content),
    '',
    `— ${entry.wordCount} words, ${entry.readingTime} min read`,
  ]
    .filter((line) => line !== '')
    .join('\n');
}

/** Exports a single entry as a `.txt` file. */
export function exportEntryAsText(entry: Entry): void {
  download(`${entry.title || 'entry'}.txt`, entryAsText(entry), 'text/plain');
}

/** Exports a single entry as a Markdown file. */
export function exportEntryAsMarkdown(entry: Entry): void {
  const body = [
    `# ${entry.title || 'Untitled entry'}`,
    '',
    `_${formatLongDate(entry.date)}_`,
    '',
    entry.tags.length ? `Tags: ${entry.tags.map((tag) => `#${tag}`).join(' ')}` : '',
    '',
    htmlToMarkdown(entry.content),
  ].join('\n');
  download(`${entry.title || 'entry'}.md`, body, 'text/markdown');
}

/** Exports every entry plus settings as a restorable JSON backup. */
export function exportBackup(entries: Entry[]): void {
  const payload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: APP_CONFIG.name,
    entries,
    settings: loadSettings(),
  };
  download(`${APP_CONFIG.name.toLowerCase()}-backup.json`, JSON.stringify(payload), 'application/json');
}

/** Opens the browser print dialog for the current page. */
export function printEntry(): void {
  window.print();
}
