import { DEFAULT_MOOD, LIMITS, MOODS } from '@/constants';
import { createId } from '@/lib/id';
import { countWords, readingTimeMinutes } from '@/lib';
import { sanitizeTags, sanitizeTitle } from '@/lib/validate';
import type { Entry, Mood } from '@/types';

const VALID_MOODS = new Set<string>(MOODS.map((mood) => mood.id));

/** Fills in every derived field an entry needs before it is stored. */
export function withDerivedFields(entry: Entry): Entry {
  const words = countWords(entry.content);
  return {
    ...entry,
    tags: sanitizeTags(entry.tags),
    wordCount: words,
    readingTime: readingTimeMinutes(words),
  };
}

/** Sorts newest first so stored order matches the default dashboard order. */
export function byNewest(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Applies a title patch only when one was supplied. */
export function resolveTitle(patch: Partial<Entry>, current: string): string {
  return patch.title !== undefined ? sanitizeTitle(patch.title) : current;
}

/** True when a value looks like an entry record rather than an arbitrary object. */
export function looksLikeEntry(value: unknown): value is Partial<Entry> {
  return typeof value === 'object' && value !== null && 'content' in (value as Record<string, unknown>);
}

/** Returns the ISO string when it parses, otherwise the fallback. */
function safeIso(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : value;
}

/** Keeps the mood only when it is one the app knows. */
function safeMood(value: unknown): Mood {
  return typeof value === 'string' && VALID_MOODS.has(value) ? (value as Mood) : DEFAULT_MOOD;
}

/**
 * Coerces one raw record into a valid entry, filling in missing fields.
 *
 * Used for both imported backups and records already in storage, so a payload
 * written by an older build cannot reach a component that assumes every field.
 */
export function coerceEntry(raw: Partial<Entry>): Entry {
  const now = new Date().toISOString();
  const content = typeof raw.content === 'string' ? raw.content : '';
  const words = countWords(content);
  const date = safeIso(raw.date, now);
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    title: sanitizeTitle(typeof raw.title === 'string' ? raw.title : ''),
    content,
    mood: safeMood(raw.mood),
    tags: sanitizeTags(Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === 'string') : []),
    date,
    createdAt: safeIso(raw.createdAt, date),
    updatedAt: safeIso(raw.updatedAt, date),
    isFavorite: Boolean(raw.isFavorite),
    isPrivate: Boolean(raw.isPrivate),
    location: typeof raw.location === 'string' ? raw.location : undefined,
    images: Array.isArray(raw.images)
      ? raw.images.filter((src) => typeof src === 'string').slice(0, LIMITS.maxImages)
      : undefined,
    wordCount: words,
    readingTime: readingTimeMinutes(words),
  };
}

/** True when a stored record is missing something the current shape relies on. */
export function needsRepair(raw: Partial<Entry>): boolean {
  return (
    typeof raw.id !== 'string' ||
    typeof raw.date !== 'string' ||
    typeof raw.title !== 'string' ||
    !Array.isArray(raw.tags) ||
    typeof raw.wordCount !== 'number' ||
    typeof raw.readingTime !== 'number'
  );
}
