import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAutosave, useEntry } from '@/hooks';
import { useEntryStore } from '@/store';
import type { Entry } from '@/types';
import { draftDeps, draftFromEntry, emptyDraft, type StoredDraft } from './writeDraft';
import { readStartDraft, startBaseline, startOptions, type UseWriteFormOptions } from './writeFormStart';
import { useWriteActions } from './useWriteActions';

export type { UseWriteFormOptions } from './writeFormStart';

/**
 * Owns the write-page form state, autosave, publish and delete flows.
 *
 * The composer is remounted for every write request (`WriteRoute`), so this hook never
 * has to reset itself: each mount starts from the params alone.
 */
export function useWriteForm(options: UseWriteFormOptions) {
  const { id } = options;
  const existing = useEntry(id);
  const hydrated = useEntryStore((state) => state.hydrated);
  const start = useMemo(() => startOptions(options), [options]);

  const [form, setForm] = useState<StoredDraft>(() => (id ? emptyDraft() : readStartDraft(start)));
  const [loadedEntryId, setLoadedEntryId] = useState<string | null>(null);
  /**
   * Stamp of the entry as it was loaded into the form.
   *
   * Deliberately a snapshot rather than a live read of the store. Importing a backup or
   * clearing the diary rewrites the collection while the form is open, and reading the
   * store here would hand the conflict guard the *new* stamp while the form still holds
   * the old text — so the next autosave would be accepted and would overwrite the
   * imported version with stale words. Holding what the form actually loaded makes that
   * write correctly rejected instead.
   */
  const [loadedStamp, setLoadedStamp] = useState<string | undefined>(undefined);
  /** Signature of the values as they came from storage; see `useAutosave.baseline`. */
  const [baseline, setBaseline] = useState<string | undefined>(() => (id ? undefined : startBaseline(form)));

  useEffect(() => {
    if (!id || !existing || loadedEntryId === existing.id) return;
    const loaded = draftFromEntry(existing);
    setForm(loaded);
    setLoadedStamp(existing.updatedAt);
    // Opening an entry is not an edit: treat the stored values as already saved.
    setBaseline(JSON.stringify(draftDeps(loaded)));
    setLoadedEntryId(existing.id);
  }, [existing, id, loadedEntryId]);

  const patch = useCallback((next: Partial<StoredDraft>) => {
    setForm((current) => ({ ...current, ...next }));
  }, []);

  const { persist, publish, remove, saveError } = useWriteActions(form, id, start, loadedStamp);

  const { savedAt, dirty, saveNow } = useAutosave({
    // A saved entry being emptied is a real edit, so only a new entry needs content
    // before there is anything worth writing.
    enabled: Boolean(id) || Boolean(form.title || form.content),
    onSave: persist,
    deps: draftDeps(form),
    baseline,
  });

  const savedLabel = useMemo(() => {
    if (!savedAt) return dirty ? 'Unsaved changes' : 'Autosave every 5 seconds';
    return `Saved at ${savedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  }, [dirty, savedAt]);

  return {
    form,
    patch,
    publish,
    remove,
    saveNow,
    savedLabel,
    saveError,
    isSaving: dirty,
    isEditing: Boolean(id),
    // A deep link to an entry that is gone must not render an empty composer that
    // reports saves it cannot make; the page shows a not-found state instead.
    isMissing: Boolean(id) && hydrated && existing === null,
    entry: existing as Entry | null,
  } as const;
}
