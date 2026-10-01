import type { Entry } from '@/types';

/**
 * The account signed in on this device.
 *
 * `id` is the Supabase user id and is what the owner key stores, so a different account on
 * the same device is detected even if the email later changes. Carries no token: the
 * Supabase session is held by the client library, and storing a bearer token in
 * localStorage here would hand it to any injected script.
 */
export interface Account {
  id: string;
  email: string;
}

/** What a pull returns: every record the server holds, tombstones included. */
export interface PullResult {
  entries: Entry[];
  /** Server time when the response was produced. */
  serverTime: string;
}

/**
 * The remote side of sync.
 *
 * An interface with one implementation is normally worth avoiding, but this one earns it:
 * the sync engine has to be testable without a network, and a different backend can satisfy
 * the same interface later without the engine or the merge changing. The production
 * implementation is the Supabase adapter.
 */
export interface RemoteAdapter {
  /** Sends a one-time code to the address; never returns the code itself. */
  requestCode(email: string): Promise<void>;
  /** Exchanges a code for a session, or null when the code is wrong or expired. */
  verifyCode(email: string, code: string): Promise<Account | null>;
  /** Confirms the stored session is still accepted, or null once it is not. */
  resume(account: Account): Promise<Account | null>;
  /**
   * Uploads records. Tombstones travel here too, so a delete reaches other devices.
   *
   * Returns the ids the server accepted. A row whose stamp is not strictly newer than the
   * stored one is rejected; the caller keeps a rejected id queued instead of clearing a
   * change the server never took. An adapter that cannot report this returns nothing, which
   * the engine reads as "all accepted".
   */
  push(account: Account, entries: Entry[]): Promise<string[] | void>;
  /** Downloads every record the account holds. */
  pull(account: Account): Promise<PullResult>;
  /** Ends the session. */
  signOut(account: Account): Promise<void>;
}
