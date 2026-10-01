import type { Entry } from '@/types';
import { coerceEntry, looksLikeEntry } from '../entryFields';
import type { Account, PullResult, RemoteAdapter } from '../sync/types';
import { currentAccount, requestCode, signOut, verifyCode } from './auth';
import { getSupabase } from './client';
import { EntryRow, fromRow, toRow } from './mapper';

/** Re-exported so the sign-in form can explain a failure instead of blaming the network. */
export { authFailureMessage } from './auth';

/** Raised when a table or RPC call fails, so the engine can report one shape. */
export class RemoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RemoteError';
  }
}

/** Requires the client, or throws the one error the UI shows when sync is off. */
async function client() {
  const promise = getSupabase();
  if (!promise) throw new RemoteError('Cloud sync is not configured in this build.');
  return promise;
}

/**
 * The Supabase adapter.
 *
 * Reads are scoped by row-level security: a `select` returns only the caller's rows, so the
 * adapter never has to filter by owner and cannot leak another account's diary through a
 * missing `where`. Writes go through the `upsert_entries` RPC, which inserts a row or
 * updates it only when the incoming `updated_at` is strictly newer — the atomic guard that
 * stops two devices from clobbering each other out of order.
 */
export const supabaseAdapter: RemoteAdapter = {
  requestCode,
  verifyCode,
  resume: () => currentAccount(),
  signOut: () => signOut(),

  async push(account: Account, entries: Entry[]): Promise<string[]> {
    if (entries.length === 0) return [];
    const supabase = await client();
    const rows = entries.map((entry) => toRow(entry, account.id));
    // The RPC returns the ids it actually accepted. A row whose incoming stamp is not newer
    // than the stored one is rejected and left out, so the caller keeps it queued instead of
    // clearing a change the server never took.
    const { data, error } = await supabase.rpc('upsert_entries', { p_rows: rows });
    if (error) throw new RemoteError(error.message);
    const accepted = Array.isArray(data) ? (data as string[]) : rows.map((row) => row.id);
    // The RPC returning an empty list for a non-empty push is not the stale-stamp case: a
    // stale row is simply left out of a non-empty result. Zero accepted out of several sent
    // means the write was refused wholesale — RLS sees no `auth.uid()` (expired or missing
    // session) or the policy rejected every row. The engine reads `[]` as "all rejected as
    // stale" and keeps the queue forever with no error, so the user stares at "N waiting to
    // upload" with no explanation. Report it honestly instead of a silent stall.
    if (rows.length > 0 && accepted.length === 0) {
      throw new RemoteError(
        'The server refused every change. Your session may have expired; sign in again.',
      );
    }
    return accepted;
  },

  async pull(): Promise<PullResult> {
    const supabase = await client();
    // No owner filter: RLS limits the result to the caller's rows. PostgREST caps a single
    // response at 1000 rows, so page with `.range` until a short page ends the walk; a pull
    // that stopped at 1000 would silently drop every older entry from the merge.
    const rows: EntryRow[] = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('updated_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) throw new RemoteError(error.message);
      const page = (data ?? []) as EntryRow[];
      rows.push(...page);
      if (page.length < PAGE) break;
    }
    // Repair at the boundary. The merge and the write-back act on these records before
    // anything else validates them, and a record with no id would be keyed `undefined` (two
    // of them collapsing into one) or, if it won, written to storage and then dropped by the
    // next read — losing the local copy while the server kept the broken one.
    const entries = rows.map(fromRow).filter(looksLikeEntry).map(coerceEntry);
    return { entries, serverTime: new Date().toISOString() };
  },
};
