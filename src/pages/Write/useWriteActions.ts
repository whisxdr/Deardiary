import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, STORAGE_KEYS } from '@/constants';
import { removeKey, writeJson } from '@/lib/storage';
import { useCreateEntry, useDeleteEntry, useUpdateEntry } from '@/hooks';
import { toast } from '@/components/ui';
import type { EntryDraft } from '@/types';
import type { StoredDraft } from './writeDraft';

/** Publish, delete and manual-save behaviour for the write page. */
export function useWriteActions(form: StoredDraft, id: string | undefined) {
  const navigate = useNavigate();
  const createEntry = useCreateEntry();
  const patchEntry = useUpdateEntry();
  const removeEntry = useDeleteEntry();

  /** Writes the current form values to storage; also used by autosave. */
  const persist = useCallback(() => {
    if (id) {
      patchEntry(id, {
        title: form.title,
        content: form.content,
        mood: form.mood,
        tags: form.tags,
        date: form.date,
        location: form.location,
        isFavorite: form.isFavorite,
        isPrivate: form.isPrivate,
      });
      return;
    }
    // A brand-new entry is kept as a local draft until it is published.
    writeJson(STORAGE_KEYS.draft, { ...form, updatedAt: new Date().toISOString() });
  }, [form, id, patchEntry]);

  const publish = useCallback(() => {
    const payload: Partial<EntryDraft> = {
      title: form.title,
      content: form.content,
      mood: form.mood,
      tags: form.tags,
      date: form.date,
      location: form.location || undefined,
      isFavorite: form.isFavorite,
      isPrivate: form.isPrivate,
    };

    if (id) {
      patchEntry(id, payload);
      toast.success('Entry updated');
      navigate(ROUTES.reader(id));
      return;
    }

    const created = createEntry(payload);
    removeKey(STORAGE_KEYS.draft);
    toast.success('Entry published');
    navigate(ROUTES.reader(created.id));
  }, [createEntry, form, id, navigate, patchEntry]);

  const remove = useCallback(() => {
    if (!id) return;
    removeEntry(id);
    toast.success('Entry deleted');
    navigate(ROUTES.dashboard);
  }, [id, navigate, removeEntry]);

  return { persist, publish, remove } as const;
}
