import { APP_CONFIG } from '@/constants';
import { useEntryStore, useSyncStore } from '@/store';
import { syncEnabled } from '@/services/sync/config';
import { estimateUsage } from '@/lib/storage';
import { formatBytes, formatCount } from '@/lib';

/** About section: version, storage usage and credits. */
export function AboutSection() {
  const entries = useEntryStore((state) => state.entries);
  const signedIn = useSyncStore((state) => state.account) !== null;
  const syncing = syncEnabled() && signedIn;

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
          <dd className="text-primary-700 dark:text-primary-200">{formatBytes(estimateUsage())}</dd>
        </div>
      </dl>
      <p className="font-sub text-base italic text-muted dark:text-primary-300">
        {syncing
          ? 'Built as an offline-first diary. Your words live on this device and, while you are signed in, a copy is kept on your sync server.'
          : 'Built as an offline-first diary. Your words stay on this device, in this browser, unless you export them.'}
      </p>
    </section>
  );
}
