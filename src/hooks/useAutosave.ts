import { useCallback, useEffect, useRef, useState } from 'react';
import { TIMING } from '@/constants';
import { useIdleSave } from './useIdleSave';
import { useSaveOnLeave } from './useSaveOnLeave';

interface AutosaveOptions {
  /** Idle delay before a save fires, in milliseconds. */
  intervalMs?: number;
  /** When false the timer stays idle. */
  enabled?: boolean;
  /** Runs whenever the payload changed and the idle delay elapsed. */
  onSave: () => void;
  /** Values that should trigger a save when they change. */
  deps: unknown[];
  /**
   * Signature of values loaded from storage. Passing it marks those values as already
   * saved, so opening a page does not look like an unsaved edit and rewrite it.
   */
  baseline?: string;
}

/**
 * Saves once the watched values have been stable for `intervalMs`.
 *
 * The values present when the hook first runs count as already saved, and a pending
 * save is flushed on unmount and on `pagehide`, so leaving the page inside the idle
 * window cannot drop the last edit.
 */
export function useAutosave({
  intervalMs = TIMING.autosaveIntervalMs,
  enabled = true,
  onSave,
  deps,
  baseline,
}: AutosaveOptions) {
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const saveRef = useRef(onSave);
  const signature = JSON.stringify(deps);
  const signatureRef = useRef(signature);
  signatureRef.current = signature;
  // The first render is the starting point, not an unsaved edit.
  const lastSavedRef = useRef<string | null>(signature);

  useEffect(() => {
    saveRef.current = onSave;
  }, [onSave]);

  const saveNow = useCallback(() => {
    saveRef.current();
    lastSavedRef.current = signature;
    setDirty(false);
    setSavedAt(new Date());
  }, [signature]);

  // Declared before the timer effect so a freshly loaded baseline wins on the same pass.
  useEffect(() => {
    if (baseline === undefined) return;
    lastSavedRef.current = baseline;
    setDirty(false);
  }, [baseline]);

  useIdleSave({
    intervalMs,
    enabled,
    signature,
    lastSavedRef,
    onFire: saveNow,
    onDirty: () => setDirty(true),
    onClean: () => setDirty(false),
  });

  useSaveOnLeave(() => {
    if (lastSavedRef.current === signatureRef.current) return;
    saveRef.current();
    lastSavedRef.current = signatureRef.current;
  });

  return { savedAt, dirty, saveNow } as const;
}
