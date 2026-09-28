import { create } from 'zustand';
import {
  createEntry,
  deleteEntry,
  listEntries,
  replaceEntries,
  toggleFavorite,
  updateEntry,
} from '@/services/entryService';
import type { Entry, EntryDraft, EntryUpdate } from '@/types';

interface EntryState {
  entries: Entry[];
  hydrated: boolean;
  hydrate: () => void;
  addEntry: (draft: Partial<EntryDraft>) => Entry;
  patchEntry: (id: string, patch: EntryUpdate) => Entry | null;
  removeEntry: (id: string) => void;
  favorite: (id: string) => void;
  replaceAll: (entries: Entry[]) => void;
}

/** Single source of truth for entries, backed by localStorage. */
export const useEntryStore = create<EntryState>((set, get) => ({
  entries: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ entries: listEntries(), hydrated: true });
  },

  addEntry: (draft) => {
    const entry = createEntry(draft);
    set({ entries: listEntries() });
    return entry;
  },

  patchEntry: (id, patch) => {
    const updated = updateEntry(id, patch);
    set({ entries: listEntries() });
    return updated;
  },

  removeEntry: (id) => {
    deleteEntry(id);
    set({ entries: listEntries() });
  },

  favorite: (id) => {
    toggleFavorite(id);
    set({ entries: listEntries() });
  },

  replaceAll: (entries) => {
    replaceEntries(entries);
    set({ entries: listEntries() });
  },
}));
