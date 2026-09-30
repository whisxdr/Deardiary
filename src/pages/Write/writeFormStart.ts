import { STORAGE_KEYS } from '@/constants';
import { readJson } from '@/lib/storage';
import { draftDeps, type StoredDraft } from './writeDraft';
import { initialDraft } from './draftStart';

export interface UseWriteFormOptions {
  id?: string;
  templateId?: string | null;
  backdated?: boolean;
  /** ISO date chosen on the calendar, used as the entry's day. */
  dated?: string | null;
  /** True only for "Continue Writing", which resumes a stored draft. */
  resume?: boolean;
}

/** Everything a composer start is decided from, in one comparable value. */
export interface StartOptions {
  templateId: string | null;
  backdated: boolean;
  dated: string | null;
  resume: boolean;
}

/** Narrows the raw route params into the shape the start helpers expect. */
export function startOptions(options: UseWriteFormOptions): StartOptions {
  return {
    templateId: options.templateId ?? null,
    backdated: Boolean(options.backdated),
    dated: options.dated ?? null,
    resume: Boolean(options.resume),
  };
}

/** Reads the stored draft and turns it into this composer's starting state. */
export function readStartDraft(start: StartOptions): StoredDraft {
  return initialDraft(
    readJson<StoredDraft | null>(STORAGE_KEYS.draft, null),
    start.templateId,
    start.backdated,
    start.dated,
    start.resume,
  );
}

/** The signature autosave treats as "already stored" for a freshly started draft. */
export function startBaseline(draft: StoredDraft): string {
  return JSON.stringify(draftDeps(draft));
}
