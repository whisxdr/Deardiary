import { create } from 'zustand';
import { STORAGE_KEYS } from '@/constants';
import { readJson, removeKey, writeJson } from '@/lib/storage';
import { httpAdapter } from '@/services/sync/httpAdapter';
import { syncNow } from '@/services/sync/engine';
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
 * Holds the account session and runs sync passes.
 *
 * The adapter is injected rather than imported at each call site so a test can drive the
 * whole flow against a stub without a network, and so swapping the reference HTTP adapter
 * for a provider SDK is a one-line change here.
 */
export function createSyncStore(adapter: RemoteAdapter = httpAdapter) {
  return create<SyncState>((set, get) => ({
    account: readJson<Account | null>(STORAGE_KEYS.session, null),
    status: 'signed-out',
    message: '',
    ready: false,

    requestCode: async (email) => {
      await adapter.requestCode(email);
    },

    verifyCode: async (email, code) => {
      const account = await adapter.verifyCode(email, code);
      if (!account) {
        set({ message: 'That code is wrong or has expired.' });
        return false;
      }
      writeJson(STORAGE_KEYS.session, account);
      // `ready` has to be set here too, not only in `restore`: it is what the lifecycle
      // hook gates the focus and online listeners on, so leaving it false would sign the
      // user in and then never sync again until a reload.
      set({ account, status: 'idle', message: '', ready: true });
      // Signing in is what turns sync on, so the first pass runs immediately: the user
      // expects their entries to appear, not to wait for the next focus event.
      await get().sync();
      return true;
    },

    restore: async () => {
      const stored = get().account;
      if (!stored) {
        set({ ready: true, status: 'signed-out' });
        return;
      }
      try {
        const account = await adapter.resume(stored);
        if (!account) {
          // The session is genuinely gone; drop it so the UI stops claiming a login.
          removeKey(STORAGE_KEYS.session);
          set({ account: null, status: 'signed-out', ready: true });
          return;
        }
        set({ account, status: 'idle', ready: true });
      } catch {
        // Unreachable is not signed out. Keep the session and say so, otherwise a flaky
        // network would silently log the user out of their own diary.
        set({ status: 'offline', ready: true });
      }
    },

    sync: async () => {
      const account = get().account;
      if (!account || get().status === 'syncing') return;
      set({ status: 'syncing', message: '' });
      const report = await syncNow(adapter, account);
      if (report.error) {
        set({ status: report.error.includes('reached') ? 'offline' : 'error', message: report.error });
        return;
      }
      // A pass can change the collection, so the store has to re-read it.
      useEntryStore.getState().refresh();
      set({ status: 'idle', message: '' });
    },

    signOut: async () => {
      const account = get().account;
      set({ account: null, status: 'signed-out', message: '' });
      removeKey(STORAGE_KEYS.session);
      // The local diary stays: signing out is not a delete, and dropping entries the
      // user can still see would be the worst possible reading of "sign out".
      if (account) await adapter.signOut(account).catch(() => undefined);
    },

    clearMessage: () => set({ message: '' }),
  }));
}

export const useSyncStore = createSyncStore();
