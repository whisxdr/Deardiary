import { useEffect } from 'react';
import { useEntryStore, useSyncStore } from '@/store';
import { hasPendingUpload, queueSignature } from './syncQueueState';
import { useSyncOnReturn } from './useSyncOnReturn';

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
 */
export function useSyncLifecycle(): void {
  const restore = useSyncStore((state) => state.restore);
  const sync = useSyncStore((state) => state.sync);
  const ready = useSyncStore((state) => state.ready);
  const account = useSyncStore((state) => state.account);

  useEffect(() => {
    void restore();
  }, [restore]);

  useSyncOnReturn(Boolean(ready && account), sync);

  // Push after a local write. Subscribing to the entry store rather than calling sync from
  // each action keeps the entry service unaware of the network, and the delay means a
  // burst of typing produces one push instead of one per keystroke.
  //
  // Two things this has to get right. A sync pass writes entries itself, so `refresh()`
  // notifies this subscription: reacting to that would schedule another pass, which
  // refreshes again, forever — the signature guards against it, because a pass does not
  // change what is still queued. And work queued before this effect mounted is already
  // waiting, so it is pushed on mount instead of waiting for a change that already
  // happened.
  useEffect(() => {
    if (!ready || !account) return;

    let timer: number | null = null;
    let seen = queueSignature();

    const schedule = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        void sync();
      }, PUSH_DELAY_MS);
    };

    if (hasPendingUpload()) schedule();

    const unsubscribe = useEntryStore.subscribe(() => {
      const signature = queueSignature();
      if (signature === seen || signature === '') return;
      seen = signature;
      schedule();
    });

    return () => {
      unsubscribe();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [account, ready, sync]);
}
