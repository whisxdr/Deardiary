import type { Entry } from '@/types';

/**
 * The account signed in on this device.
 *
 * Carries no token. Credentials belong to the adapter — the reference implementation
 * uses an httpOnly cookie, which JavaScript cannot read, so a script injected into the
 * page cannot steal the session. Storing a bearer token here would hand it to any XSS.
 */
export interface Account {
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
 * An interface with one implementation is normally worth avoiding, but this one has a
 * concrete reason: the sync engine has to be testable before a production backend is
 * chosen, and the owner has not chosen one. The reference adapter talks to `/api` over
 * HTTP; a provider SDK can satisfy the same interface later without the engine changing.
 */
export interface RemoteAdapter {
  /** Sends a one-time code to the address; never returns the code itself. */
  requestCode(email: string): Promise<void>;
  /** Exchanges a code for a session, or null when the code is wrong or expired. */
  verifyCode(email: string, code: string): Promise<Account | null>;
  /** Confirms the stored session is still accepted, or null once it is not. */
  resume(account: Account): Promise<Account | null>;
  /** Uploads records. Tombstones travel here too, so a delete reaches other devices. */
  push(account: Account, entries: Entry[]): Promise<void>;
  /** Downloads every record the account holds. */
  pull(account: Account): Promise<PullResult>;
  /** Ends the session server-side. */
  signOut(account: Account): Promise<void>;
}
