import { ENTRY_TEMPLATES, MOODS } from '@/constants';
import { sanitizeTags } from '@/lib/validate';
import { emptyDraft, type StoredDraft } from './writeDraft';

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
 * True when this composer start should load the stored draft.
 *
 * A template, a backdated request or an explicit day from the calendar always wins: the
 * composer only sends one when the user just picked it, and starting from a draft would
 * ignore the choice. "Continue Writing" is the only caller that passes `resumeDraft`.
 */
export function resumesDraft(
  templateId: string | null,
  backdated: boolean,
  dated?: string | null,
  resumeDraft = false,
): boolean {
  return resumeDraft && templateId === null && !backdated && !dated;
}

/** Keeps a stored field only when it carries the type the form expects. */
function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

/**
 * Repairs a draft read from storage into the shape the composer relies on.
 *
 * Storage is a trust boundary: a draft written by an older build, hand-edited or left by a
 * failed write can carry any shape, and a single wrong type takes the whole composer down —
 * a `tags` string reached `TagInput`'s `.map`, and the ErrorBoundary replaced the page with
 * "This page lost its bookmark". Every field falls back on its own, so one damaged value
 * never discards the rest of the note. Tags go through the same sanitizer the write path
 * uses, so the chip list shows exactly what an entry would store.
 *
 * Content is deliberately not truncated here. A legacy body longer than the limit stays
 * visible in the editor, where the character counter warns before the write path clamps it;
 * cutting it at load would drop the tail with nothing on screen to say so.
 */
export function coerceDraft(stored: Partial<StoredDraft>): StoredDraft {
  const base = emptyDraft();
  const rawDate = asString(stored.date, base.date);
  return {
    title: asString(stored.title, base.title),
    content: asString(stored.content, base.content),
    mood: MOODS.find((item) => item.id === stored.mood)?.id ?? base.mood,
    tags: Array.isArray(stored.tags)
      ? sanitizeTags(stored.tags.filter((tag): tag is string => typeof tag === 'string'))
      : base.tags,
    date: Number.isNaN(new Date(rawDate).getTime()) ? base.date : rawDate,
    location: asString(stored.location, base.location),
    isFavorite: typeof stored.isFavorite === 'boolean' ? stored.isFavorite : base.isFavorite,
    isPrivate: typeof stored.isPrivate === 'boolean' ? stored.isPrivate : base.isPrivate,
    updatedAt: asString(stored.updatedAt, base.updatedAt),
  };
}

/**
 * Starting state for a new entry.
 *
 * A leftover draft is loaded only when the caller asks for it, because the same route
 * serves both intents: "Continue Writing" resumes the draft, while every "New entry"
 * button must open a clean page. Loading the draft by default made "New entry" reopen
 * the previous note, which reads as a stuck cache.
 */
export function initialDraft(
  stored: StoredDraft | null,
  templateId: string | null,
  backdated: boolean,
  dated?: string | null,
  resumeDraft = false,
): StoredDraft {
  if (stored && resumesDraft(templateId, backdated, dated, resumeDraft)) {
    return coerceDraft(stored);
  }

  const draft = emptyDraft();
  const template = ENTRY_TEMPLATES.find((item) => item.id === templateId);
  if (template?.content) draft.content = template.content;
  if (dated) draft.date = dayToIso(dated);
  else if (backdated) draft.date = new Date(Date.now() - 86_400_000).toISOString();
  return draft;
}
