import { create } from 'zustand';
import { DEFAULT_SETTINGS, loadSettings, resetSettings, saveSettings } from '@/services/settingsService';
import type { FontSize, ThemeName, UserSettings } from '@/types';

interface SettingsState {
  settings: UserSettings;
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

  hydrate: () => {
    const settings = loadSettings();
    applySettingsToDocument(settings);
    set({ settings });
  },

  update: (patch) => {
    const settings = { ...get().settings, ...patch };
    saveSettings(settings);
    applySettingsToDocument(settings);
    set({ settings });
  },

  setTheme: (theme) => get().update({ theme }),

  setFontSize: (fontSize) => get().update({ fontSize }),

  reset: () => {
    const settings = resetSettings();
    applySettingsToDocument(settings);
    set({ settings });
  },
}));
