import { useCallback, useState } from 'react';
import { readJson, writeJson } from '@/lib/storage';

/** useState mirror that persists every write to localStorage. */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => readJson<T>(key, initialValue));

  const update = useCallback(
    (next: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved = typeof next === 'function' ? (next as (value: T) => T)(current) : next;
        writeJson(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  const clear = useCallback(() => {
    setValue(initialValue);
    writeJson(key, initialValue);
  }, [initialValue, key]);

  return { value, setValue: update, clear } as const;
}
