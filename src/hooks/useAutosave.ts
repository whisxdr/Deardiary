import { useCallback, useEffect, useRef, useState } from 'react';
import { TIMING } from '@/constants';

interface AutosaveOptions {
  /** Interval between autosave attempts, in milliseconds. */
  intervalMs?: number;
  /** When false the timer stays idle. */
  enabled?: boolean;
  /** Runs whenever the payload changes and the interval elapses. */
  onSave: () => void;
  /** Values that should trigger a save when they change. */
  deps: unknown[];
}

/** Saves on an interval, but only when the watched values actually changed. */
export function useAutosave({ intervalMs = TIMING.autosaveIntervalMs, enabled = true, onSave, deps }: AutosaveOptions) {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const saveRef = useRef(onSave);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  const signature = JSON.stringify(deps);

  useEffect(() => {
    if (!enabled) return;
    if (signature === lastSavedRef.current) return;
    setDirty(true);
  }, [enabled, signature]);

  const saveNow = useCallback(() => {
    saveRef.current();
    lastSavedRef.current = signature;
    setDirty(false);
    setSavedAt(new Date());
  }, [signature]);

  useEffect(() => {
    if (!enabled || !dirty) return;
    const timer = window.setInterval(saveNow, intervalMs);
    return () => window.clearInterval(timer);
  }, [dirty, enabled, intervalMs, saveNow]);

  return { savedAt, dirty, saveNow } as const;
}
