import { ENTRY_TEMPLATES } from '@/constants';
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
    return { ...emptyDraft(), ...stored };
  }

  const draft = emptyDraft();
  const template = ENTRY_TEMPLATES.find((item) => item.id === templateId);
  if (template?.content) draft.content = template.content;
  if (dated) draft.date = dayToIso(dated);
  else if (backdated) draft.date = new Date(Date.now() - 86_400_000).toISOString();
  return draft;
}
