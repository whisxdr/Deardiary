/** Namespace prefix so every key this app writes is easy to spot. */
export const STORAGE_NAMESPACE = 'deardiary';

/** localStorage keys used across services and stores. */
export const STORAGE_KEYS = {
  entries: `${STORAGE_NAMESPACE}:entries`,
  settings: `${STORAGE_NAMESPACE}:settings`,
  draft: `${STORAGE_NAMESPACE}:draft`,
  seeded: `${STORAGE_NAMESPACE}:seeded`,
  view: `${STORAGE_NAMESPACE}:view`,
} as const;

/** Version stamped into exported backups. */
export const BACKUP_VERSION = 1;
