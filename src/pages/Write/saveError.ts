import { useEntryStore } from '@/store';

/** Why a write did not land, or null when it did. */
export type SaveError = 'missing' | 'conflict' | 'storage' | null;

/**
 * Explains a rejected patch.
 *
 * A rejected write is either a page removed elsewhere or one another tab has changed
 * since this composer opened. Telling them apart is what decides whether the user should
 * reload or stop editing, so the store is asked which case it is.
 */
export function explainRejectedWrite(id: string): SaveError {
  const exists = useEntryStore.getState().entries.some((entry) => entry.id === id);
  return exists ? 'conflict' : 'missing';
}

/** User-facing wording for each failure. */
export const SAVE_ERROR_TEXT: Record<Exclude<SaveError, null>, string> = {
  missing: 'This entry no longer exists, so changes are not being saved.',
  conflict: 'This entry was changed in another tab. Reload before editing further.',
  storage: 'Storage is full, so changes will be lost when you reload.',
};
