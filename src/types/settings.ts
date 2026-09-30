/** Avatar rendering preferences. */
export interface AvatarSettings {
  /** Seed string handed to DiceBear; changing it changes the portrait. */
  avatarSeed: string;
}

/** Visual themes available in Appearance settings. */
export type ThemeName = 'leather' | 'paper' | 'night';

/** Editor body text sizes. */
export type FontSize = 'sm' | 'md' | 'lg';

/**
 * Privacy preferences.
 *
 * Only flags the app actually honours live here. A "require a password" toggle was
 * removed because there is no unlock screen and no hashing code: the setting was
 * stored and never read, so it claimed a protection the app did not provide.
 */
export interface PrivacySettings {
  hidePrivateEntries: boolean;
}

/**
 * Persisted user preferences.
 *
 * Reminder and digest toggles were removed together with the Notifications section:
 * no scheduler ever read them, so they promised behaviour the app did not have.
 */
export interface UserSettings {
  displayName: string;
  bio: string;
  avatarSeed: string;
  theme: ThemeName;
  fontSize: FontSize;
  privacy: PrivacySettings;
}

/** Shape written by the export service and accepted by the import service. */
export interface BackupPayload {
  version: number;
  exportedAt: string;
  entries: unknown[];
  settings?: Partial<UserSettings>;
}
