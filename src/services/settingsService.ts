import { DEFAULT_AVATAR_SEED } from '@/constants/avatar';
import { STORAGE_KEYS } from '@/constants';
import { readJson, writeJson } from '@/lib/storage';
import type { UserSettings } from '@/types';

/** Defaults applied on first run and when a stored field is missing. */
export const DEFAULT_SETTINGS: UserSettings = {
  displayName: 'Dear Writer',
  bio: 'Keeping small notes about ordinary days.',
  avatarSeed: DEFAULT_AVATAR_SEED,
  theme: 'leather',
  fontSize: 'md',
  reminderTime: '20:00',
  notifications: {
    dailyReminder: true,
    streakAlerts: true,
    weeklyDigest: false,
  },
  privacy: {
    requirePassword: false,
    hidePrivateEntries: false,
  },
};

/** Reads settings, merging stored values over the defaults. */
export function loadSettings(): UserSettings {
  const stored = readJson<Partial<UserSettings>>(STORAGE_KEYS.settings, {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    notifications: { ...DEFAULT_SETTINGS.notifications, ...stored.notifications },
    privacy: { ...DEFAULT_SETTINGS.privacy, ...stored.privacy },
  };
}

/** Persists settings. */
export function saveSettings(settings: UserSettings): boolean {
  return writeJson(STORAGE_KEYS.settings, settings);
}

/** Clears stored settings so the next read falls back to defaults. */
export function resetSettings(): UserSettings {
  saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}
