import { DEFAULT_AVATAR_SEED } from '@/constants/avatar';
import { STORAGE_KEYS } from '@/constants';
import { readJson, writeJson } from '@/lib/storage';
import type { FontSize, ThemeName, UserSettings } from '@/types';

/** Defaults applied on first run and when a stored field is missing. */
export const DEFAULT_SETTINGS: UserSettings = {
  displayName: 'Dear Writer',
  bio: 'Keeping small notes about ordinary days.',
  avatarSeed: DEFAULT_AVATAR_SEED,
  theme: 'leather',
  fontSize: 'md',
  privacy: {
    hidePrivateEntries: false,
  },
};

const THEMES: ThemeName[] = ['leather', 'paper', 'night'];
const FONT_SIZES: FontSize[] = ['sm', 'md', 'lg'];

/** Keeps a string field only when it is a usable string. */
function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

/**
 * Keeps a free-text field when it is any string, empty included.
 *
 * Empty is a value the user typed: falling back to the default here would make the
 * display name and the bio impossible to clear, because every write re-coerces.
 */
function text(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

/** Keeps a boolean field only when it is a boolean. */
function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Coerces stored settings into a usable shape.
 *
 * The header renders `displayName` on every page, so a single wrong type in storage
 * used to take the whole app down rather than just the settings page.
 *
 * Keys this build no longer has (the old `notifications` group, `reminderTime`) are
 * ignored on purpose, so a backup written by an older build still restores.
 */
export function coerceSettings(stored: Partial<UserSettings> | null): UserSettings {
  const raw = stored ?? {};
  const theme = THEMES.includes(raw.theme as ThemeName) ? (raw.theme as ThemeName) : DEFAULT_SETTINGS.theme;
  const fontSize = FONT_SIZES.includes(raw.fontSize as FontSize)
    ? (raw.fontSize as FontSize)
    : DEFAULT_SETTINGS.fontSize;

  return {
    displayName: text(raw.displayName, DEFAULT_SETTINGS.displayName),
    bio: text(raw.bio, DEFAULT_SETTINGS.bio),
    avatarSeed: str(raw.avatarSeed, DEFAULT_SETTINGS.avatarSeed),
    theme,
    fontSize,
    privacy: {
      hidePrivateEntries: bool(raw.privacy?.hidePrivateEntries, DEFAULT_SETTINGS.privacy.hidePrivateEntries),
    },
  };
}

/** Reads settings, filling in defaults for anything missing or malformed. */
export function loadSettings(): UserSettings {
  return coerceSettings(readJson<Partial<UserSettings> | null>(STORAGE_KEYS.settings, null));
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
