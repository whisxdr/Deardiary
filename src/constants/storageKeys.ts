/** Namespace prefix so every key this app writes is easy to spot. */
export const STORAGE_NAMESPACE = 'deardiary';

/** localStorage keys used across services and stores. */
export const STORAGE_KEYS = {
  entries: `${STORAGE_NAMESPACE}:entries`,
  settings: `${STORAGE_NAMESPACE}:settings`,
  draft: `${STORAGE_NAMESPACE}:draft`,
  view: `${STORAGE_NAMESPACE}:view`,
  /**
   * Ids of entries the user deleted, newest last.
   *
   * A deleted entry leaves no other trace, so importing a backup written before the
   * deletion would bring it back. This log is what keeps a delete a delete. Id only:
   * no content, no stamp, and it is capped because the oldest deletions matter least.
   */
  deletedIds: `${STORAGE_NAMESPACE}:deleted-ids`,
} as const;

/**
 * Keys the removed sync build wrote. Nothing reads them any more.
 *
 * They are cleared once at startup because they survive "Clear all entries" on their own:
 * `owner` holds an account id and `outbox` the un-uploaded queue, and the storage estimate
 * on the Data screen counts their bytes.
 */
export const LEGACY_SYNC_KEYS = [
  `${STORAGE_NAMESPACE}:outbox`,
  `${STORAGE_NAMESPACE}:owner`,
  `${STORAGE_NAMESPACE}:clock`,
] as const;

/** Version stamped into exported backups. */
export const BACKUP_VERSION = 1;
