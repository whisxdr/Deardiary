/** Namespace prefix so every key this app writes is easy to spot. */
export const STORAGE_NAMESPACE = 'deardiary';

/** localStorage keys used across services and stores. */
export const STORAGE_KEYS = {
  entries: `${STORAGE_NAMESPACE}:entries`,
  settings: `${STORAGE_NAMESPACE}:settings`,
  draft: `${STORAGE_NAMESPACE}:draft`,
  view: `${STORAGE_NAMESPACE}:view`,
  /** Entry ids changed locally and not yet uploaded; see `services/sync/outbox.ts`. */
  outbox: `${STORAGE_NAMESPACE}:outbox`,
  /**
   * Account id the local entries belong to (the Supabase user id).
   *
   * Without it, signing out and signing in as someone else adopted the previous account's
   * diary and uploaded it to the new one. A missing value means no account ever signed in
   * here, so the entries are this person's own offline writing and adopting them is right.
   */
  owner: `${STORAGE_NAMESPACE}:owner`,
  /** Highest logical stamp this device has observed; see `services/sync/clock.ts`. */
  clock: `${STORAGE_NAMESPACE}:clock`,
} as const;

/** Version stamped into exported backups. */
export const BACKUP_VERSION = 1;
