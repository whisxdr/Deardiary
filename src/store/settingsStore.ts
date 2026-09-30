import { create } from 'zustand';
import {
  DEFAULT_SETTINGS,
  coerceSettings,
  loadSettings,
  resetSettings,
  saveSettings,
} from '@/services/settingsService';
import type { FontSize, ThemeName, UserSettings } from '@/types';

interface SettingsState {
  settings: UserSettings;
  /** True once settings have been read from storage. */
  hydrated: boolean;
  hydrate: () => void;
  update: (patch: Partial<UserSettings>) => void;
  setTheme: (theme: ThemeName) => void;
  setFontSize: (fontSize: FontSize) => void;
  reset: () => void;
}

/** Applies the theme and font size to the document so CSS can react. */
export function applySettingsToDocument(settings: UserSettings): void {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.fontSize = settings.fontSize;
  root.classList.toggle('dark', settings.theme === 'night');
}

/** User preferences store; every write also updates the document attributes. */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  // Hydrating once matters: `useTheme` calls this on every page, and re-reading storage
  // on each navigation would discard a change whose write failed.
  hydrate: () => {
    if (get().hydrated) return;
    const settings = loadSettings();
    applySettingsToDocument(settings);
    set({ settings, hydrated: true });
  },

  // Merge first, then coerce: a partial patch (an imported backup, one field from a
  // settings control) is completed by the current settings, and only the merged result
  // is validated. Coercing the patch alone would reset every field it does not carry.
  update: (patch) => {
    const settings = coerceSettings({ ...get().settings, ...patch });
    saveSettings(settings);
    applySettingsToDocument(settings);
    set({ settings, hydrated: true });
  },

  setTheme: (theme) => get().update({ theme }),

  setFontSize: (fontSize) => get().update({ fontSize }),

  reset: () => {
    const settings = resetSettings();
    applySettingsToDocument(settings);
    set({ settings, hydrated: true });
  },
}));
