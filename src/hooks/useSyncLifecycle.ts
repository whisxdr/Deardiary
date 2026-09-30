import { useEffect } from 'react';
import { pendingCount } from '@/services';
import { useEntryStore, useSyncStore } from '@/store';

/** Quiet period after a local write before the push runs. */
const PUSH_DELAY_MS = 2_000;

/**
 * Keeps the account session alive and syncs at the moments that matter.
 *
 * Four triggers. One when the app opens; one when the tab regains focus (the phone came
 * back from the pocket, the laptop woke up); one when the connection returns; and one
 * after a local write settles. That last one is not optional: without it a new entry sat
 * on the device that wrote it until the user happened to switch tabs, which is exactly
 * the case where someone types on the laptop and then looks at their phone.
 *
 * Deliberately not a timer. A poll would wake the radio on a phone for no reason, and
 * this app has one writer, so a change arriving a few seconds late costs nothing.
 */
export function useSyncLifecycle(): void {
  const restore = useSyncStore((state) => state.restore);
  const sync = useSyncStore((state) => state.sync);
  const ready = useSyncStore((state) => state.ready);
  const account = useSyncStore((state) => state.account);

  useEffect(() => {
    void restore();
  }, [restore]);

  useEffect(() => {
    if (!ready || !account) return;

    const pull = () => {
      if (document.visibilityState === 'visible') void sync();
    };
    window.addEventListener('focus', pull);
    window.addEventListener('online', pull);
    return () => {
      window.removeEventListener('focus', pull);
      window.removeEventListener('online', pull);
    };
  }, [account, ready, sync]);

  // Push after a local write. Subscribing to the store rather than calling sync from each
  // action keeps the entry service unaware of the network, and the delay means a burst of
  // typing produces one push instead of one per keystroke.
  useEffect(() => {
    if (!ready || !account) return;

    let timer: number | null = null;
    const unsubscribe = useEntryStore.subscribe(() => {
      if (pendingCount() === 0) return;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        void sync();
      }, PUSH_DELAY_MS);
    });

    return () => {
      unsubscribe();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [account, ready, sync]);
}
