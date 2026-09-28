/** Avatar rendering preferences. */
export interface AvatarSettings {
  /** Seed string handed to DiceBear; changing it changes the portrait. */
  avatarSeed: string;
}

/** Visual themes available in Appearance settings. */
export type ThemeName = 'leather' | 'paper' | 'night';

/** Editor body text sizes. */
export type FontSize = 'sm' | 'md' | 'lg';

/** Notification preferences. */
export interface NotificationSettings {
  dailyReminder: boolean;
  streakAlerts: boolean;
  weeklyDigest: boolean;
}

/** Privacy preferences. */
export interface PrivacySettings {
  requirePassword: boolean;
  hidePrivateEntries: boolean;
}

/** Persisted user preferences. */
export interface UserSettings {
  displayName: string;
  bio: string;
  avatarSeed: string;
  theme: ThemeName;
  fontSize: FontSize;
  reminderTime?: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  passwordHash?: string;
}

/** Shape written by the export service and accepted by the import service. */
export interface BackupPayload {
  version: number;
  exportedAt: string;
  entries: unknown[];
  settings?: Partial<UserSettings>;
}
