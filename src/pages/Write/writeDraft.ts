import { DEFAULT_MOOD, ENTRY_TEMPLATES } from '@/constants';
import type { Entry, Mood } from '@/types';

/** Shape stored under the draft key while a new entry is still being written. */
export interface StoredDraft {
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  date: string;
  location: string;
  isFavorite: boolean;
  isPrivate: boolean;
  updatedAt: string;
}

/** A blank draft stamped with the current time. */
export function emptyDraft(): StoredDraft {
  const now = new Date().toISOString();
  return {
    title: '',
    content: '',
    mood: DEFAULT_MOOD,
    tags: [],
    date: now,
    location: '',
    isFavorite: false,
    isPrivate: false,
    updatedAt: now,
  };
}

/** Turns a saved entry into the draft shape used by the write form. */
export function draftFromEntry(entry: Entry): StoredDraft {
  return {
    title: entry.title,
    content: entry.content,
    mood: entry.mood,
    tags: entry.tags,
    date: entry.date,
    location: entry.location ?? '',
    isFavorite: entry.isFavorite,
    isPrivate: entry.isPrivate,
    updatedAt: entry.updatedAt,
  };
}

/** The draft fields autosave watches, shared with the load path's baseline. */
export function draftDeps(draft: StoredDraft): unknown[] {
  return [draft.title, draft.content, draft.mood, draft.tags, draft.date, draft.location];
}

/**
 * Turns a `yyyy-MM-dd` day from a link into a timestamp.
 *
 * Built from local parts rather than passed to `new Date(value)`: the bare date string
 * parses as UTC midnight, which lands on the previous day for anyone behind UTC.
 */
function dayToIso(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  const at = new Date(year, month - 1, date, 12, 0, 0);
  return Number.isNaN(at.getTime()) ? new Date().toISOString() : at.toISOString();
}

/**
 * Starting state for a new entry.
 *
 * A template, a backdated request or an explicit day chosen from the calendar wins over
 * a leftover draft: the composer only sends one when the user just picked it, and
 * silently discarding that choice makes the composer look broken. "Blank page" is sent
 * as the `free` template, so it counts as a choice too and is not overridden by the draft.
 */
export function initialDraft(
  stored: StoredDraft | null,
  templateId: string | null,
  backdated: boolean,
  dated?: string | null,
): StoredDraft {
  const template = ENTRY_TEMPLATES.find((item) => item.id === templateId);
  const hasExplicitStart = templateId !== null || backdated || Boolean(dated);

  if (stored && !hasExplicitStart) return { ...emptyDraft(), ...stored };

  const draft = emptyDraft();
  if (template?.content) draft.content = template.content;
  if (dated) draft.date = dayToIso(dated);
  else if (backdated) draft.date = new Date(Date.now() - 86_400_000).toISOString();
  return draft;
}
