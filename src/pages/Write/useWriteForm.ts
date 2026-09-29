import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STORAGE_KEYS } from '@/constants';
import { readJson } from '@/lib/storage';
import { useAutosave, useEntry } from '@/hooks';
import type { Entry } from '@/types';
import { draftDeps, draftFromEntry, emptyDraft, initialDraft, type StoredDraft } from './writeDraft';
import { useWriteActions } from './useWriteActions';

export interface UseWriteFormOptions {
  id?: string;
  templateId?: string | null;
  backdated?: boolean;
  /** ISO date chosen on the calendar, used as the entry's day. */
  dated?: string | null;
}

/**
 * Owns the write-page form state, autosave, publish and delete flows.
 *
 * The route for a new entry and the route for an existing one render the same
 * component, so the form resets whenever `id` changes; otherwise "New entry" opened
 * from the editor would keep the previous entry's text and publish a duplicate.
 */
export function useWriteForm({ id, templateId, backdated, dated }: UseWriteFormOptions) {
  const existing = useEntry(id);

  const startDraft = useCallback(
    () =>
      initialDraft(
        readJson<StoredDraft | null>(STORAGE_KEYS.draft, null),
        templateId ?? null,
        Boolean(backdated),
        dated,
      ),
    [backdated, dated, templateId],
  );

  const [form, setForm] = useState<StoredDraft>(() => (id ? emptyDraft() : startDraft()));

  const [loadedEntryId, setLoadedEntryId] = useState<string | null>(null);
  /** Signature of the values as they came from storage; see `useAutosave.baseline`. */
  const [baseline, setBaseline] = useState<string | undefined>(() => (id ? undefined : JSON.stringify(draftDeps(form))));

  // Reset when the route switches between composing and editing, or between entries.
  const previousId = useRef(id);
  useEffect(() => {
    if (previousId.current === id) return;
    previousId.current = id;
    setLoadedEntryId(null);
    if (id) {
      setForm(emptyDraft());
      setBaseline(undefined);
      return;
    }
    const next = startDraft();
    setForm(next);
    setBaseline(JSON.stringify(draftDeps(next)));
  }, [id, startDraft]);

  useEffect(() => {
    if (!id || !existing || loadedEntryId === existing.id) return;
    const loaded = draftFromEntry(existing);
    setForm(loaded);
    // Opening an entry is not an edit: treat the stored values as already saved.
    setBaseline(JSON.stringify(draftDeps(loaded)));
    setLoadedEntryId(existing.id);
  }, [existing, id, loadedEntryId]);

  const patch = useCallback((next: Partial<StoredDraft>) => {
    setForm((current) => ({ ...current, ...next }));
  }, []);

  const { persist, publish, remove } = useWriteActions(form, id);

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
    isSaving: dirty,
    isEditing: Boolean(id),
    entry: existing as Entry | null,
  } as const;
}
