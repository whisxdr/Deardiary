import { useCallback, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS } from '@/constants';
import { readJson } from '@/lib/storage';
import { useAutosave, useEntry } from '@/hooks';
import type { Entry } from '@/types';
import { draftFromEntry, emptyDraft, initialDraft, type StoredDraft } from './writeDraft';
import { useWriteActions } from './useWriteActions';

export interface UseWriteFormOptions {
  id?: string;
  templateId?: string | null;
  backdated?: boolean;
}

/** Owns the write-page form state, autosave, publish and delete flows. */
export function useWriteForm({ id, templateId, backdated }: UseWriteFormOptions) {
  const existing = useEntry(id);

  const [form, setForm] = useState<StoredDraft>(() => {
    if (id) return emptyDraft();
    return initialDraft(readJson<StoredDraft | null>(STORAGE_KEYS.draft, null), templateId ?? null, Boolean(backdated));
  });

  const [loadedEntryId, setLoadedEntryId] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !existing || loadedEntryId === existing.id) return;
    setForm(draftFromEntry(existing));
    setLoadedEntryId(existing.id);
  }, [existing, id, loadedEntryId]);

  const patch = useCallback((next: Partial<StoredDraft>) => {
    setForm((current) => ({ ...current, ...next }));
  }, []);

  const { persist, publish, remove } = useWriteActions(form, id);

  const { savedAt, dirty, saveNow } = useAutosave({
    enabled: Boolean(form.title || form.content),
    onSave: persist,
    deps: [form.title, form.content, form.mood, form.tags, form.date, form.location],
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
