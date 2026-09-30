import { useEffect } from 'react';

/**
 * Runs `pull` when the user comes back to the tab or the connection returns.
 *
 * Focus covers the phone leaving a pocket and the laptop waking up; `online` covers a
 * connection that came back. Deliberately not a timer: a poll would wake the radio on a
 * phone for no reason, and with one writer a change arriving a few seconds late costs
 * nothing.
 */
export function useSyncOnReturn(enabled: boolean, pull: () => void): void {
  useEffect(() => {
    if (!enabled) return;
    const run = () => {
      if (document.visibilityState === 'visible') pull();
    };
    window.addEventListener('focus', run);
    window.addEventListener('online', run);
    return () => {
      window.removeEventListener('focus', run);
      window.removeEventListener('online', run);
    };
  }, [enabled, pull]);
}
