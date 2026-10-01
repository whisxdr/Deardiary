import { STORAGE_NAMESPACE } from '@/constants';

/**
 * Whether localStorage can be used.
 *
 * Probed once, at module load, rather than per call. Deciding per call let a read
 * fall back to the in-memory map while a later write succeeded against
 * localStorage: the collection written from the empty in-memory copy then replaced
 * every stored entry.
 */
const persistent = ((): boolean => {
  try {
    const probe = `${STORAGE_NAMESPACE}:probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
})();

/** Values written when localStorage refused the write, newest wins on read. */
const memory = new Map<string, string>();

/**
 * Whether the most recent write reached localStorage, tracked per key.
 *
 * Tracked per key rather than as one module-level flag: more than one writer can be in
 * flight, and a single flag reported the wrong key's result.
 */
const writeStatus = new Map<string, boolean>();

/**
 * True when the last write to `key` only reached the in-memory fallback.
 *
 * Read immediately after a synchronous write, so a caller that reports success can tell
 * the user their change will not survive a reload instead of claiming it saved.
 */
export function lastWriteFailed(key: string): boolean {
  return writeStatus.get(key) === false;
}

/** True when writes reach localStorage rather than the in-memory fallback. */
export function isPersistent(): boolean {
  return persistent;
}

/** Reads and JSON-parses a localStorage key, returning `fallback` on any failure. */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = memory.get(key) ?? (persistent ? window.localStorage.getItem(key) : null);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Serializes a value to JSON and writes it to localStorage.
 *
 * Returns false when the value only reached the in-memory fallback, so a caller
 * that cares can say the change will not survive a reload.
 */
export function writeJson(key: string, value: unknown): boolean {
  let raw: string;
  try {
    raw = JSON.stringify(value);
  } catch {
    writeStatus.set(key, false);
    return false;
  }

  if (persistent) {
    try {
      window.localStorage.setItem(key, raw);
      memory.delete(key);
      writeStatus.set(key, true);
      return true;
    } catch {
      // Quota or a mid-session block: keep the value in memory so the page stays
      // consistent, and report that it did not reach disk.
    }
  }

  memory.set(key, raw);
  writeStatus.set(key, false);
  return false;
}

/** Removes a key from both storages. */
export function removeKey(key: string): void {
  memory.delete(key);
  try {
    if (persistent) window.localStorage.removeItem(key);
  } catch {
    /* storage became unavailable; the in-memory copy is already gone */
  }
}

/** True when the given key exists in either storage. */
export function hasKey(key: string): boolean {
  if (memory.has(key)) return true;
  try {
    return persistent ? window.localStorage.getItem(key) !== null : false;
  } catch {
    return false;
  }
}

/** Size of every stored key in bytes, used by the Data settings section. */
export function estimateUsage(): number {
  if (!persistent) return 0;
  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(STORAGE_NAMESPACE))
    .reduce((total, key) => total + key.length + (window.localStorage.getItem(key)?.length ?? 0), 0);
}
