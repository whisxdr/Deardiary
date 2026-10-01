import { useMemo } from 'react';
import { APP_CONFIG } from '@/constants';
import { syncEnabled } from '@/services/supabase/config';
import { useEntryStore, useSyncStore } from '@/store';
import { estimateUsage } from '@/lib/storage';
import { formatBytes, formatCount } from '@/lib';

/**
 * The local-first line for the current sync state.
 *
 * Config-off keeps the offline-only sentence. Signed in, the app is no longer local-only, so
 * saying the words stay on the device would be false — the honest line names the cloud copy.
 */
function aboutCopy(signedIn: boolean): string {
  if (!syncEnabled()) {
    return 'Built as an offline-first diary. Your words stay on this device, in this browser, unless you export them.';
  }
  if (signedIn) {
    return 'Built as an offline-first diary. Sync is on, so your entries also live in your account on the server, stored as plain text.';
  }
  return 'Built as an offline-first diary. Your words stay on this device until you sign in to sync.';
}

/** About section: version, storage usage and credits. */
export function AboutSection() {
  const entries = useEntryStore((state) => state.entries);
  const signedIn = useSyncStore((state) => state.account !== null);

  // Scans every stored key, so run once per entry-count change rather than per render.
  const usageLabel = useMemo(() => formatBytes(estimateUsage()), [entries.length]);

  return (
    <section aria-labelledby="about-heading" className="flex flex-col gap-3">
      <h2 id="about-heading" className="font-display text-lg text-primary-800 dark:text-primary-100">
        About
      </h2>
      <dl className="grid gap-2 font-body text-sm sm:grid-cols-2">
        <div className="flex flex-col">
          <dt className="text-xs uppercase tracking-wide text-muted">App</dt>
          <dd className="text-primary-700 dark:text-primary-200">{`${APP_CONFIG.name} v${APP_CONFIG.version}`}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs uppercase tracking-wide text-muted">Author</dt>
          <dd className="text-primary-700 dark:text-primary-200">{APP_CONFIG.author}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs uppercase tracking-wide text-muted">Entries stored</dt>
          <dd className="text-primary-700 dark:text-primary-200">{formatCount(entries.length, 'entry', 'entries')}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs uppercase tracking-wide text-muted">Storage used</dt>
          <dd className="text-primary-700 dark:text-primary-200">{usageLabel}</dd>
        </div>
      </dl>
      <p className="font-sub text-base italic text-muted dark:text-primary-300">{aboutCopy(signedIn)}</p>
    </section>
  );
}
