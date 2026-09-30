import { useCallback, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '@/constants';
import { readJson } from '@/lib/storage';
import { useAutosave, useEntry } from '@/hooks';
import { useEntryStore } from '@/store';
import type { Entry } from '@/types';
import { draftDeps, draftFromEntry, emptyDraft, type StoredDraft } from './writeDraft';
import { initialDraft, resumesDraft } from './draftStart';
import { useWriteActions } from './useWriteActions';

export interface UseWriteFormOptions {
  id?: string;
  templateId?: string | null;
  backdated?: boolean;
  /** ISO date chosen on the calendar, used as the entry's day. */
  dated?: string | null;
  /** True only for "Continue Writing", which resumes a stored draft. */
  resume?: boolean;
}

/**
 * Owns the write-page form state, autosave, publish and delete flows.
 *
 * The composer is remounted for every write request (`WriteRoute`), so this hook never
 * has to reset itself: each mount starts from the params alone.
 */
export function useWriteForm({ id, templateId, backdated, dated, resume }: UseWriteFormOptions) {
  const existing = useEntry(id);
  const hydrated = useEntryStore((state) => state.hydrated);

  const startDraft = useCallback(
    () =>
      initialDraft(
        readJson<StoredDraft | null>(STORAGE_KEYS.draft, null),
        templateId ?? null,
        Boolean(backdated),
        dated,
        Boolean(resume),
      ),
    [backdated, dated, resume, templateId],
  );

  const [form, setForm] = useState<StoredDraft>(() => (id ? emptyDraft() : startDraft()));

  const [loadedEntryId, setLoadedEntryId] = useState<string | null>(null);
  /** Signature of the values as they came from storage; see `useAutosave.baseline`. */
  const [baseline, setBaseline] = useState<string | undefined>(() => (id ? undefined : JSON.stringify(draftDeps(form))));

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

  // Publishing this composer spends the draft only when it is the one it resumed.
  const consumeDraft = !id && resumesDraft(templateId ?? null, Boolean(backdated), dated, Boolean(resume));

  const { persist, publish, remove, saveError } = useWriteActions(form, id, consumeDraft, existing?.updatedAt);

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
