import { Button } from '@/components/ui';
import { pendingCount } from '@/services';
import { useSyncStore } from '@/store';
import { SyncSignIn } from './SyncSignIn';

/**
 * Sign-in and sync state.
 *
 * The signed-in view reports the upload queue, because "everything is uploaded" and
 * "three entries are still waiting" look identical in a diary otherwise, and the second
 * one means the other device has not received them yet.
 */
export function SyncSection() {
  const account = useSyncStore((state) => state.account);
  const status = useSyncStore((state) => state.status);
  const message = useSyncStore((state) => state.message);
  const sync = useSyncStore((state) => state.sync);
  const signOut = useSyncStore((state) => state.signOut);

  const pending = pendingCount();

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
          {message ? (
            <p role="alert" className="font-body text-xs text-error">
              {message}
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
        </>
      ) : (
        <SyncSignIn />
      )}
    </section>
  );
}
