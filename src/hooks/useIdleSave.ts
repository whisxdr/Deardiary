import { useEffect, useRef } from 'react';

interface IdleSaveOptions {
  /** Idle delay before the save fires. */
  intervalMs: number;
  /** When false the timer stays idle. */
  enabled: boolean;
  /** Signature of the values being watched; the timer restarts when it changes. */
  signature: string;
  /** Signature the values had when they were last stored. */
  lastSavedRef: React.MutableRefObject<string | null>;
  /** Performs the save. */
  onFire: () => void;
  /** Called when a change is pending, so the UI can show a saving state. */
  onDirty: () => void;
  /** Called when nothing is pending, so the UI stops claiming it is saving. */
  onClean: () => void;
}

/**
 * Fires `onFire` once the watched signature has been stable for `intervalMs`.
 *
 * Restarting on every change makes this an idle debounce rather than a fixed interval:
 * a continuously-typing user is not saved mid-sentence, and a paused user is saved
 * without waiting for a window to roll over.
 */
export function useIdleSave({
  intervalMs,
  enabled,
  signature,
  lastSavedRef,
  onFire,
  onDirty,
  onClean,
}: IdleSaveOptions): void {
  const callbacks = useRef({ onFire, onDirty, onClean });
  callbacks.current = { onFire, onDirty, onClean };

  useEffect(() => {
    if (!enabled) {
      // Nothing to save once the form is empty again; stop claiming it is saving.
      callbacks.current.onClean();
      return;
    }
    if (lastSavedRef.current === signature) return;

    callbacks.current.onDirty();
    const timer = window.setTimeout(() => {
      // A load may have marked these values as stored while the timer ran.
      if (lastSavedRef.current === signature) return;
      callbacks.current.onFire();
    }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [enabled, intervalMs, lastSavedRef, signature]);
}
