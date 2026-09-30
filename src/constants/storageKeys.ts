/** Namespace prefix so every key this app writes is easy to spot. */
export const STORAGE_NAMESPACE = 'deardiary';

/** localStorage keys used across services and stores. */
export const STORAGE_KEYS = {
  entries: `${STORAGE_NAMESPACE}:entries`,
  settings: `${STORAGE_NAMESPACE}:settings`,
  draft: `${STORAGE_NAMESPACE}:draft`,
  view: `${STORAGE_NAMESPACE}:view`,
  /** Entry ids changed locally and not yet uploaded; see `services/outbox.ts`. */
  outbox: `${STORAGE_NAMESPACE}:outbox`,
  /** Server-side stamp per entry id, so a pull can tell what this device has seen. */
  synced: `${STORAGE_NAMESPACE}:synced`,
  /** Session token and account email for the optional cloud sync. */
  session: `${STORAGE_NAMESPACE}:session`,
} as const;

/** Version stamped into exported backups. */
export const BACKUP_VERSION = 1;
