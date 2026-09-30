import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, STORAGE_KEYS } from '@/constants';
import { lastWriteFailed, removeKey, writeJson } from '@/lib/storage';
import { useCreateEntry, useDeleteEntry, useUpdateEntry } from '@/hooks';
import { toast } from '@/components/ui';
import { explainRejectedWrite, type SaveError } from './saveError';
import { draftPayload, type StoredDraft } from './writeDraft';

/** Publish, delete and manual-save behaviour for the write page. */
export function useWriteActions(
  form: StoredDraft,
  id: string | undefined,
  consumeDraft: boolean,
  storedUpdatedAt?: string,
) {
  const navigate = useNavigate();
  const createEntry = useCreateEntry();
  const patchEntry = useUpdateEntry();
  const removeEntry = useDeleteEntry();
  const [saveError, setSaveError] = useState<SaveError>(null);
  // Set by publish so the leave-flush cannot write the published text back into the
  // draft key it just cleared: that offered "Continue writing" for a finished entry.
  const published = useRef(false);
  /**
   * Stamp of the record this composer is editing, as storage has it.
   *
   * Follows the loaded entry rather than `form.updatedAt`: an id route starts from an
   * empty draft, so the form's stamp is the moment the page opened, not the record's.
   * Refreshed after every successful write so the next one is accepted, and deliberately
   * left alone after a rejected one so a retry is rejected too rather than silently
   * overwriting whatever the other tab wrote.
   */
  const stampRef = useRef(storedUpdatedAt);

  useEffect(() => {
    stampRef.current = storedUpdatedAt;
  }, [storedUpdatedAt]);

  /** Writes the current form values to storage; also used by autosave. */
  const persist = useCallback((): boolean => {
    if (id) {
      // A missing id means the entry was deleted in another tab; there is nothing to
      // patch and recreating it silently would resurrect a page the user removed.
      const updated = patchEntry(id, draftPayload(form), stampRef.current);
      if (updated) {
        stampRef.current = updated.updatedAt;
        setSaveError(lastWriteFailed() ? 'storage' : null);
        return true;
      }
      setSaveError(explainRejectedWrite(id));
      return false;
    }
    // A brand-new entry is kept as a local draft until it is published.
    if (published.current) return true;
    const written = writeJson(STORAGE_KEYS.draft, { ...form, updatedAt: new Date().toISOString() });
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
      toast.success('Entry updated');
      navigate(ROUTES.reader(id));
      return;
    }

    const created = createEntry(draftPayload(form));
    published.current = true;
    // Only a draft this composer resumed is spent. A template or a day picked on the
    // calendar starts a separate entry, and publishing it must leave an unfinished
    // note from another session alone.
    if (consumeDraft) removeKey(STORAGE_KEYS.draft);
    toast.success('Entry published');
    navigate(ROUTES.reader(created.id));
  }, [consumeDraft, createEntry, form, id, navigate, patchEntry]);

  const remove = useCallback(() => {
    if (!id) return;
    published.current = true;
    removeEntry(id);
    toast.success('Entry deleted');
    navigate(ROUTES.dashboard);
  }, [id, navigate, removeEntry]);

  return { persist, publish, remove, saveError } as const;
}
