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

/** Starting state for a new entry: stored draft first, then template, then backdate. */
export function initialDraft(
  stored: StoredDraft | null,
  templateId: string | null,
  backdated: boolean,
): StoredDraft {
  if (stored) return { ...emptyDraft(), ...stored };
  const draft = emptyDraft();
  const template = ENTRY_TEMPLATES.find((item) => item.id === templateId);
  if (template) draft.content = template.content;
  if (backdated) draft.date = new Date(Date.now() - 86_400_000).toISOString();
  return draft;
}
