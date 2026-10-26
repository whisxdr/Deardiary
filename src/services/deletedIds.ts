import { STORAGE_KEYS } from '@/constants';
import { readJson, writeJson } from '@/lib/storage';

/**
 * Remembers deleted ids so a backup written before the deletion cannot resurrect them.
 *
 * Id only: no content and no stamp, and the log is capped because the oldest deletions
 * matter least. Kept apart from `entryQuery` because it is the one piece of entry state
 * that outlives the collection it describes.
 */
const DELETED_IDS_CAP = 1_000;

export function rememberDeleted(ids: string[]): void {
  if (ids.length === 0) return;
  const known = readJson<string[]>(STORAGE_KEYS.deletedIds, []).filter((id) => typeof id === 'string');
  const merged = [...new Set([...known, ...ids])].slice(-DELETED_IDS_CAP);
  writeJson(STORAGE_KEYS.deletedIds, merged);
}

/** True when the user deleted this id, so an import must not restore it. */
export function wasDeleted(id: string): boolean {
  return readJson<string[]>(STORAGE_KEYS.deletedIds, []).includes(id);
}
