import type { User } from '@supabase/supabase-js';
import type { Account } from '../sync/types';
import { getSupabase } from './client';

/** Raised when an auth call is made while sync is disabled. */
export class SyncDisabledError extends Error {
  constructor() {
    super('Cloud sync is not configured in this build.');
    this.name = 'SyncDisabledError';
  }
}

/** Builds the account from a Supabase user, or null when the fields are unusable. */
function toAccount(user: User | null | undefined): Account | null {
  if (!user || !user.id) return null;
  return { id: user.id, email: user.email ?? '' };
}

/** Requires the client, or throws the one error the UI shows when sync is off. */
function client() {
  const promise = getSupabase();
  if (!promise) throw new SyncDisabledError();
  return promise;
}

/** The one message shown when the failure really is the network. */
const CONNECTION_MESSAGE = 'Could not reach the server. Check your connection and try again.';

/** True when the failure looks like the transport, not the server answering. */
function isNetworkFailure(message: string): boolean {
  return /fetch|network|offline|reach|connection|timed out|load failed/i.test(message);
}

/**
 * Turns an auth failure into the message the sign-in form should show.
 *
 * The form used to blame the network for every error, so a 429 rate limit ("you can only
 * request this after N seconds") was shown as a connection problem and the user pressed the
 * button again, extending the limit. The server's own wording is what explains those cases,
 * so it is passed through unchanged; the generic connection text is reserved for a failure
 * that genuinely looks like the transport.
 */
export function authFailureMessage(error: unknown): string {
  const raw = error instanceof Error && error.message ? error.message : '';
  if (!raw) return CONNECTION_MESSAGE;
  return isNetworkFailure(raw) ? CONNECTION_MESSAGE : raw;
}

/**
 * Sends a one-time code to the address.
 *
 * `signInWithOtp` with `shouldCreateUser: true`: the first sign-in is also the sign-up, so
 * there is no separate register step. The token is delivered only when the project's
 * email template contains `{{ .Token }}` (its length follows the project's `otp_length`
 * setting). Because that flag makes the first sign-in a sign-up, BOTH templates need it:
 * `Authentication > Email Templates > Confirm signup` (new users) and `Magic Link`
 * (existing users), e.g. "Your DearDiary code is {{ .Token }}". Without it the mail carries
 * only a link and the code field can never be filled.
 */
export async function requestCode(email: string): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw new Error(error.message);
}

/** Exchanges a code for the signed-in account, or null when the code is wrong or expired. */
export async function verifyCode(email: string, code: string): Promise<Account | null> {
  const supabase = await client();
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) {
    // A bad code is a normal outcome the form explains; anything else is a real failure.
    if (/invalid|expired|token/i.test(error.message)) return null;
    throw new Error(error.message);
  }
  return toAccount(data.user);
}

/** Reads the current session's account, or null when there is none. */
export async function currentAccount(): Promise<Account | null> {
  const supabase = await client();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return toAccount(data.session?.user);
}

/** Ends the session. */
export async function signOut(): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

/**
 * Subscribes to the SDK's auth events, calling `onChange` with the live account, or null
 * once the session has ended.
 *
 * The store owns the session indirectly, so a sign-out this app did not start — another
 * tab, an expiry, or a server-side revocation — only reaches it through this listener.
 * Returns an unsubscribe function; the store keeps one subscription for its lifetime and
 * ignores signed-in events, so a sign-in echo cannot loop back into another sign-out.
 */
export function onAuthChange(onChange: (account: Account | null) => void): () => void {
  const promise = getSupabase();
  if (!promise) return () => undefined;
  let subscription: { unsubscribe: () => void } | null = null;
  void promise
    .then((supabase) => {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        onChange(toAccount(session?.user));
      });
      subscription = data.subscription;
    })
    .catch(() => undefined);
  return () => subscription?.unsubscribe();
}
