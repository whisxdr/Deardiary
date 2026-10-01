import { Button } from '@/components/ui';
import { pendingCount } from '@/hooks/syncQueueState';
import { useSyncStore } from '@/store';
import { SyncSignIn } from './SyncSignIn';

/** Human-readable line for the current pass state. */
function statusLine(status: string): string {
  if (status === 'syncing') return 'Syncing…';
  if (status === 'offline') return 'Offline. Changes are saved here and will upload when the connection returns.';
  return '';
}

/**
 * Sign-in and sync state.
 *
 * The signed-in view reports the upload queue, because "everything is uploaded" and
 * "three entries are still waiting" look identical in a diary otherwise, and the second
 * one means the other device has not received them yet.
 */
export function SyncSection() {
  const account = useSyncStore((state) => state.account);
  const ready = useSyncStore((state) => state.ready);
  const status = useSyncStore((state) => state.status);
  const message = useSyncStore((state) => state.message);
  const sync = useSyncStore((state) => state.sync);
  const signOut = useSyncStore((state) => state.signOut);

  const pending = pendingCount();
  const note = message || statusLine(status);

  return (
    <section aria-labelledby="sync-heading" className="flex flex-col gap-3">
      <h2 id="sync-heading" className="font-display text-lg text-primary-800 dark:text-primary-100">
        Account and sync
      </h2>

      {account ? (
        <>
          <p className="font-body text-xs text-primary-500 dark:text-primary-300">
            {`Signed in as ${account.email}. `}
            {pending > 0 ? `${pending} waiting to upload.` : 'Everything is uploaded.'}
          </p>
          {note ? (
            <p role="status" className="font-body text-xs text-muted">
              {note}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void sync()} disabled={status === 'syncing'}>
              {status === 'syncing' ? 'Syncing…' : 'Sync now'}
            </Button>
            <Button variant="ghost" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
          <p className="font-body text-xs text-muted">
            Signing out keeps every entry on this device. Only the connection is removed.
          </p>
          <p className="font-body text-xs text-muted">
            While signed in, your entries are stored on the server as plain text, not encrypted. Anyone with access to
            your Supabase project can read them.
          </p>
        </>
      ) : !ready ? (
        // `restore` is async (dynamic adapter import plus `getSession`), so a stored session
        // arrives after the first paint. Showing the form now would flash sign-in and then
        // swap to the signed-in view, so wait instead of rendering a wrong state.
        <p className="font-body text-xs text-primary-500 dark:text-primary-300">Checking your session…</p>
      ) : (
        <SyncSignIn />
      )}
    </section>
  );
}
