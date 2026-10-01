import { create } from 'zustand';
import { syncEnabled } from '@/services/supabase/config';
import { syncNow } from '@/services/sync/engine';
import { claimDevice, isForeignAccount, readOwner } from '@/services/sync/owner';
import { useEntryStore } from './entryStore';
import type { Account, RemoteAdapter } from '@/services/sync/types';

/** What the settings UI needs to know about the sync state. */
export type SyncStatus = 'signed-out' | 'idle' | 'syncing' | 'offline' | 'error';

interface SyncState {
  account: Account | null;
  status: SyncStatus;
  /** Set when the last pass failed, for the UI to show. */
  message: string;
  /** True once the stored session has been checked. */
  ready: boolean;
  requestCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<boolean>;
  restore: () => Promise<void>;
  sync: () => Promise<void>;
  signOut: () => Promise<void>;
  clearMessage: () => void;
}

/**
 * Loads the Supabase adapter on first use.
 *
 * A static import would pull the Supabase client into the chunk of every route, because the
 * lifecycle hook is mounted in the providers. The dynamic import keeps it in its own chunk,
 * fetched only once sync is configured and actually used.
 */
async function loadAdapter(): Promise<RemoteAdapter> {
  const { supabaseAdapter } = await import('@/services/supabase/adapter');
  return supabaseAdapter;
}

/** True when the failure is the network, not the server rejecting the request. */
function isOffline(message: string): boolean {
  return /reach|network|offline|fetch|connection|timed out/i.test(message);
}

/**
 * Holds the account session and runs sync passes.
 *
 * The session is not copied into storage: `restore` asks the adapter (the Supabase SDK) for
 * the current session, so there is no token this app owns and no stale login to outlive a
 * real sign-out. Only the owner id is kept, and only to tell whose diary the local entries
 * are. The adapter is injected so a test can drive the whole flow against a stub without a
 * network.
 */
export function createSyncStore(injected?: RemoteAdapter) {
  let cached: RemoteAdapter | null = injected ?? null;
  const adapter = async (): Promise<RemoteAdapter> => (cached ??= await loadAdapter());
  /** A test injects its own adapter and does not need the env vars; a build does. */
  const enabled = (): boolean => injected !== undefined || syncEnabled();

  return create<SyncState>((set, get) => {
    // Mirror SDK sign-out/revocation and account changes. Claim changed owners before sync.

    let watching = false;
    const watchAuth = async (): Promise<void> => {
      // An injected adapter (a test) has no SDK session to watch.
      if (injected || watching || !syncEnabled()) return;
      watching = true;
      const { onAuthChange } = await import('@/services/supabase/auth');
      onAuthChange((account) => {
        const current = get().account;
        if (!account) {
          if (current) set({ account: null, status: 'signed-out', message: 'Your session ended. Sign in again to keep syncing.' });
          return;
        }
        const foreign = isForeignAccount(account.id);
        claimDevice(account.id);
        if (foreign) useEntryStore.getState().refresh();
        if (current?.id === account.id) return;
        set({ account, status: 'idle', message: '', ready: true });
        void get().sync();
      });
    };

    return {
      account: null,
      status: 'signed-out',
      message: '',
      ready: false,

      requestCode: async (email) => {
        if (!enabled()) throw new Error('Sync is not configured.');
        await (await adapter()).requestCode(email);
      },

      verifyCode: async (email, code) => {
        const account = await (await adapter()).verifyCode(email, code);
        if (!account) {
          set({ message: 'That code is wrong or has expired.' });
          return false;
        }

        // Claims the device for this account, clearing the local diary first when a different
        // account owned it — otherwise signing in would upload someone else's entries into
        // this account. A missing owner key means no account ever signed in here, so the
        // offline entries are adopted (the union merge is the whole point of signing in).
        const foreign = isForeignAccount(account.id);
        claimDevice(account.id);
        // `claimDevice` writes storage directly; re-read so a foreign owner's entries are
        // gone from the store too, even if the first sync below fails.
        if (foreign) useEntryStore.getState().refresh();
        // `ready` gates the focus and online listeners, so it is set here too, not only in
        // `restore`: leaving it false would sign the user in and never sync again.
        set({ account, status: 'idle', message: '', ready: true });
        await watchAuth();
        // Signing in turns sync on, so the first pass runs now: the user expects their
        // entries to appear, not to wait for the next focus event.
        await get().sync();
        return true;
      },

      restore: async () => {
        if (!enabled()) {
          set({ ready: true, status: 'signed-out' });
          return;
        }
        // No owner id means no account has ever signed in here; the session, if any, is not
        // this app's to claim.
        const owner = readOwner();
        if (!owner) {
          set({ ready: true, status: 'signed-out' });
          return;
        }
        try {
          // The adapter reads the live session from the SDK; the id is only what tells the
          // store this device has a claim to restore.
          const account = await (await adapter()).resume({ id: owner, email: '' });
          if (!account) {
            // The session is genuinely gone; the owner key stays so the next sign-in still
            // detects a different account.
            set({ account: null, status: 'signed-out', ready: true });
            return;
          }
          // The SDK's live session is authoritative and may belong to a different user than
          // the owner key — a stale session outliving a key the app never rewrote, or a
          // session left by another account on this browser. Claiming here re-checks that
          // identity before any pass runs, so a mismatch drops the prior owner's entries
          // instead of uploading them into whoever the SDK now holds.
          const foreign = isForeignAccount(account.id);
          claimDevice(account.id);
          if (foreign) useEntryStore.getState().refresh();
          set({ account, status: 'idle', ready: true });
          await watchAuth();
        } catch {
          // Unreachable is not signed out. Keep the session and say so, otherwise a flaky
          // network would silently log the user out of their own diary.
          set({ status: 'offline', ready: true });
        }
      },

      sync: async () => {
        const account = get().account;
        if (!account || get().status === 'syncing' || !enabled()) return;
        // Idempotent, and the backstop for a `restore` that ran offline: signed in means
        // listening, so a revocation the next pass cannot see still reaches the store.
        await watchAuth();
        set({ status: 'syncing', message: '' });
        try {
          // `adapter()` loads the Supabase chunk on first use, so it can reject on a chunk
          // fetch; `syncNow` can throw outside its own pull/push guards. Either way the pass
          // has to end in a state the user can retry from, not a stuck "Syncing…".
          const report = await syncNow(await adapter(), account);
          if (report.error) {
            set({ status: isOffline(report.error) ? 'offline' : 'error', message: report.error });
            return;
          }
          // A pass can change the collection, so the store has to re-read it.
          useEntryStore.getState().refresh();
          set({ status: 'idle', message: '' });
        } catch (error) {
          const message = error instanceof Error && error.message ? error.message : 'Sync failed.';
          set({ status: isOffline(message) ? 'offline' : 'error', message });
        }
      },

      signOut: async () => {
        const account = get().account;
        set({ account: null, status: 'signed-out', message: '' });
        // The local diary stays: signing out is not a delete, and dropping entries the user
        // can still see would be the worst possible reading of "sign out". The owner key also
        // stays, so the next sign-in knows whether these entries are theirs.
        if (account && enabled()) await (await adapter()).signOut(account).catch(() => undefined);
      },

      clearMessage: () => set({ message: '' }),
    };
  });
}

export const useSyncStore = createSyncStore();
