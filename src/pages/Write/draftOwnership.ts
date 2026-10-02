import { STORAGE_KEYS } from '@/constants';
import { removeKey } from '@/lib/storage';
import { resumesDraft } from './draftStart';
import type { StartOptions } from './writeFormStart';

/**
 * Clears the draft key after a new entry was published, when this composer owns the draft.
 *
 * A draft this composer resumed was spent by the publish, and so was one it autosaved
 * itself: "New entry" writes its own draft after five idle seconds, and leaving that
 * behind made the landing offer "Continue Writing" for a note already published — the
 * resumed copy then published again as a duplicate entry. A draft this composer never
 * touched belongs to another session and must stay. `resumesDraft` covers a resumed draft
 * that was never autosaved; `wroteDraft` covers one this composer wrote itself.
 */
export function clearSpentDraft(start: StartOptions, wroteDraft: boolean): void {
  const spent = wroteDraft || resumesDraft(start.templateId, start.backdated, start.dated, start.resume);
  if (spent) removeKey(STORAGE_KEYS.draft);
}
