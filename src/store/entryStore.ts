import { create } from 'zustand';
import {
  createEntry,
  deleteEntry,
  listEntries,
  replaceEntries,
  toggleFavorite,
  updateEntry,
} from '@/services/entryService';
import { lastWriteFailed } from '@/lib/storage';
import { STORAGE_KEYS } from '@/constants';
import type { Entry, EntryDraft, EntryUpdate } from '@/types';

interface EntryState {
  entries: Entry[];
  hydrated: boolean;
  /** True when the last write did not reach localStorage (quota or blocked). */
  writeFailed: boolean;
  hydrate: () => void;
  addEntry: (draft: Partial<EntryDraft>) => Entry;
  patchEntry: (id: string, patch: EntryUpdate, expectedUpdatedAt?: string) => Entry | null;
  removeEntry: (id: string) => void;
  favorite: (id: string) => void;
  replaceAll: (entries: Entry[]) => void;
  /** Re-reads storage into the store; used after a service call made outside it. */
  refresh: () => void;
  clearWriteError: () => void;
}

/**
 * Single source of truth for entries, backed by localStorage.
 *
 * Each action re-reads storage after writing so the store cannot drift from disk,
 * and records when a write only reached the in-memory fallback so the UI can say so
 * instead of silently showing a change that a reload will discard.
 */
export const useEntryStore = create<EntryState>((set, get) => ({
  entries: [],
  hydrated: false,
  writeFailed: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ entries: listEntries(), hydrated: true });
  },

  addEntry: (draft) => {
    const entry = createEntry(draft);
    set({ entries: listEntries(), writeFailed: lastWriteFailed(STORAGE_KEYS.entries) });
    return entry;
  },

  patchEntry: (id, patch, expectedUpdatedAt) => {
    const updated = updateEntry(id, patch, expectedUpdatedAt);
    set({ entries: listEntries(), writeFailed: lastWriteFailed(STORAGE_KEYS.entries) });
    return updated;
  },

  removeEntry: (id) => {
    deleteEntry(id);
    set({ entries: listEntries(), writeFailed: lastWriteFailed(STORAGE_KEYS.entries) });
  },

  favorite: (id) => {
    toggleFavorite(id);
    set({ entries: listEntries(), writeFailed: lastWriteFailed(STORAGE_KEYS.entries) });
  },

  replaceAll: (entries) => {
    const ok = replaceEntries(entries);
    set({ entries: listEntries(), writeFailed: !ok });
  },

  refresh: () => set({ entries: listEntries() }),

  clearWriteError: () => set({ writeFailed: false }),
}));
