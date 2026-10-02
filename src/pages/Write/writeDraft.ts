import { DEFAULT_MOOD, LIMITS } from '@/constants';
import type { Entry, EntryDraft, Mood } from '@/types';

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

/**
 * The draft fields autosave watches, shared with the load path's baseline.
 *
 * Favorite and private belong here. Leaving them out meant toggling either one never
 * marked the form dirty, so the idle timer never fired and the leave-flush early-returned:
 * the change was silently dropped unless the user happened to press Publish.
 */
export function draftDeps(draft: StoredDraft): unknown[] {
  return [
    draft.title,
    draft.content,
    draft.mood,
    draft.tags,
    draft.date,
    draft.location,
    draft.isFavorite,
    draft.isPrivate,
  ];
}

/**
 * The fields a write sends to storage, shared by autosave and publish.
 *
 * Content and location are bounded to `LIMITS` here, at the one point every composer write
 * passes through. The read path already clamped them, so an unbounded write was stored in
 * full and only appeared cut on the next read — the tail of a long note was on disk but not
 * on screen, and the save after that wrote the shortened text back.
 */
export function draftPayload(draft: StoredDraft): EntryDraft {
  return {
    title: draft.title,
    content: draft.content.slice(0, LIMITS.contentMaxLength),
    mood: draft.mood,
    tags: draft.tags,
    date: draft.date,
    location: draft.location.slice(0, LIMITS.locationMaxLength),
    isFavorite: draft.isFavorite,
    isPrivate: draft.isPrivate,
  };
}
