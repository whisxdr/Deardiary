import { STORAGE_NAMESPACE } from '@/constants';

const available = (): boolean => {
  try {
    const probe = `${STORAGE_NAMESPACE}:probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
};

const memory = new Map<string, string>();

/** Reads and JSON-parses a localStorage key, returning `fallback` on any failure. */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = available() ? window.localStorage.getItem(key) : memory.get(key) ?? null;
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Serializes a value to JSON and writes it to localStorage. */
export function writeJson(key: string, value: unknown): boolean {
  try {
    const raw = JSON.stringify(value);
    if (available()) window.localStorage.setItem(key, raw);
    else memory.set(key, raw);
    return true;
  } catch {
    return false;
  }
}

/** Removes a key from localStorage. */
export function removeKey(key: string): void {
  try {
    if (available()) window.localStorage.removeItem(key);
    else memory.delete(key);
  } catch {
    /* storage is unavailable; nothing to clear */
  }
}

/** True when the given key exists in storage. */
export function hasKey(key: string): boolean {
  try {
    return available() ? window.localStorage.getItem(key) !== null : memory.has(key);
  } catch {
    return false;
  }
}

/** Size of every stored key in bytes, used by the Data settings section. */
export function estimateUsage(): number {
  if (!available()) return 0;
  return Object.keys(window.localStorage)
    .filter((key) => key.startsWith(STORAGE_NAMESPACE))
    .reduce((total, key) => total + key.length + (window.localStorage.getItem(key)?.length ?? 0), 0);
}
