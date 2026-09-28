import { DEFAULT_MOOD } from '@/constants';
import { createId } from '@/lib/id';
import { sanitizeTags, sanitizeTitle } from '@/lib/validate';
import { countWords, readingTimeMinutes } from '@/lib';
import type { BackupPayload, Entry } from '@/types';

/** True when a value looks like an entry record from a backup file. */
function looksLikeEntry(value: unknown): value is Partial<Entry> {
  return typeof value === 'object' && value !== null && 'content' in (value as Record<string, unknown>);
}

/** Coerces one raw record into a valid entry, filling in missing fields. */
function coerceEntry(raw: Partial<Entry>): Entry {
  const now = new Date().toISOString();
  const content = typeof raw.content === 'string' ? raw.content : '';
  const words = countWords(content);
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    title: sanitizeTitle(typeof raw.title === 'string' ? raw.title : ''),
    content,
    mood: (raw.mood as Entry['mood']) ?? DEFAULT_MOOD,
    tags: sanitizeTags(Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === 'string') : []),
    date: typeof raw.date === 'string' ? raw.date : now,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
    isFavorite: Boolean(raw.isFavorite),
    isPrivate: Boolean(raw.isPrivate),
    location: typeof raw.location === 'string' ? raw.location : undefined,
    images: Array.isArray(raw.images) ? raw.images.filter((src) => typeof src === 'string') : undefined,
    wordCount: words,
    readingTime: readingTimeMinutes(words),
  };
}

/** Result of a backup import attempt. */
export interface ImportResult {
  ok: boolean;
  entries: Entry[];
  settings?: BackupPayload['settings'];
  message: string;
}

/** Parses an uploaded JSON backup into entries and settings. */
export function parseBackup(rawText: string): ImportResult {
  try {
    const parsed = JSON.parse(rawText) as BackupPayload | Partial<Entry>[];
    const list = Array.isArray(parsed) ? parsed : parsed.entries;
    if (!Array.isArray(list)) {
      return { ok: false, entries: [], message: 'No entries found in that file.' };
    }
    const entries = list.filter(looksLikeEntry).map(coerceEntry);
    return {
      ok: entries.length > 0,
      entries,
      settings: Array.isArray(parsed) ? undefined : parsed.settings,
      message: entries.length > 0 ? `Imported ${entries.length} entries.` : 'No valid entries found.',
    };
  } catch {
    return { ok: false, entries: [], message: 'That file is not valid JSON.' };
  }
}

/** Reads a File and parses it as a backup. */
export async function importBackupFile(file: File): Promise<ImportResult> {
  const text = await file.text();
  return parseBackup(text);
}
