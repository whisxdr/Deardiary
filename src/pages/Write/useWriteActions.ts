import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, STORAGE_KEYS } from '@/constants';
import { lastWriteFailed, writeJson } from '@/lib/storage';
import { useCreateEntry, useDeleteEntry, useUpdateEntry } from '@/hooks';
import { toast } from '@/components/ui';
import { explainRejectedWrite, reportWrite, STORAGE_FULL, type SaveError } from './saveError';
import { clearSpentDraft } from './draftOwnership';
import { draftPayload, type StoredDraft } from './writeDraft';
import type { StartOptions } from './writeFormStart';

/** Publish, delete and manual-save behaviour for the write page. */
export function useWriteActions(
  form: StoredDraft,
  id: string | undefined,
  start: StartOptions,
  loadedStamp?: string,
) {
  const navigate = useNavigate();
  const createEntry = useCreateEntry();
  const patchEntry = useUpdateEntry();
  const removeEntry = useDeleteEntry();
  const [saveError, setSaveError] = useState<SaveError>(null);
  // Set by publish so the leave-flush cannot write the published text back into the draft
  // key it just cleared; wroteDraft marks a draft this composer itself stored.
  const published = useRef(false);
  const wroteDraft = useRef(false);
  /**
   * Stamp of the entry as the form loaded it; a snapshot, not a live read of the store.
   * Following the store would hand the conflict guard a fresh stamp while the form still
   * holds older text, so the next save would overwrite another tab's work. Advanced after
   * each accepted write, and left alone after a rejected one so a retry is rejected too.
   */
  const stampRef = useRef(loadedStamp);

  useEffect(() => {
    stampRef.current = loadedStamp;
  }, [loadedStamp]);

  /** Writes the current form values to storage; also used by autosave. */
  const persist = useCallback((): boolean => {
    if (id) {
      // A missing id means the entry was deleted in another tab; there is nothing to
      // patch and recreating it silently would resurrect a page the user removed.
      const updated = patchEntry(id, draftPayload(form), stampRef.current);
      if (updated) {
        stampRef.current = updated.updatedAt;
        setSaveError(lastWriteFailed(STORAGE_KEYS.entries) ? 'storage' : null);
        return true;
      }
      setSaveError(explainRejectedWrite(id));
      return false;
    }
    // A brand-new entry is kept as a local draft until it is published.
    if (published.current) return true;
    const written = writeJson(STORAGE_KEYS.draft, { ...form, updatedAt: new Date().toISOString() });
    // Marked even when only the in-memory fallback took it: the draft is readable from
    // there too, so publishing must still spend it.
    wroteDraft.current = true;
    setSaveError(written ? null : 'storage');
    return written;
  }, [form, id, patchEntry]);

  const publish = useCallback(() => {
    if (id) {
      const updated = patchEntry(id, draftPayload(form), stampRef.current);
      if (!updated) {
        toast.error(
          explainRejectedWrite(id) === 'conflict'
            ? 'This entry changed in another tab. Reload to see the newer version before publishing.'
            : 'That entry no longer exists. Publish it as a new entry instead.',
        );
        return;
      }
      published.current = true;
      reportWrite(!lastWriteFailed(STORAGE_KEYS.entries), 'Entry updated', STORAGE_FULL);
      navigate(ROUTES.reader(id));
      return;
    }

    const created = createEntry(draftPayload(form));
    published.current = true;
    // The draft is spent only once the entry reached storage: clearing it after a fallback
    // write would leave the note nowhere but memory.
    const stored = !lastWriteFailed(STORAGE_KEYS.entries);
    if (stored) clearSpentDraft(start, wroteDraft.current);
    reportWrite(stored, 'Entry published', STORAGE_FULL);
    navigate(ROUTES.reader(created.id));
  }, [createEntry, form, id, navigate, patchEntry, start]);

  const remove = useCallback(() => {
    if (!id) return;
    published.current = true;
    const removed = removeEntry(id);
    reportWrite(removed, 'Entry deleted', 'That entry could not be deleted. Storage may be full.');
    if (removed) navigate(ROUTES.dashboard);
  }, [id, navigate, removeEntry]);

  return { persist, publish, remove, saveError } as const;
}
