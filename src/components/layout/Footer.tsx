import { APP_CONFIG, QUOTES, quoteForDate } from '@/constants';
import { syncEnabled } from '@/services/supabase/config';
import { useSyncStore } from '@/store';

/**
 * The closing line for the current sync state.
 *
 * The footer is on every page, so its claim is the one most people read. Config-off keeps the
 * local-only line; signed in, the words really are on a server, so the line says so rather
 * than repeating a promise the sync just broke.
 */
function footerNote(signedIn: boolean): string {
  const base = `${APP_CONFIG.name} v${APP_CONFIG.version} — `;
  if (!syncEnabled()) return `${base}your words stay on this device.`;
  if (signedIn) return `${base}synced to your account, stored as plain text.`;
  return `${base}your words stay on this device until you sign in.`;
}

/** Quiet footer with a rotating quote and the app version. */
export function Footer() {
  const quote = quoteForDate(new Date()) || QUOTES[0];
  const signedIn = useSyncStore((state) => state.account !== null);

  return (
    <footer className="border-t border-primary-200/60 bg-primary-50/60 py-6 dark:border-primary-700 dark:bg-primary-900/40">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-1 px-4 text-center">
        <p className="font-hand text-lg text-muted dark:text-primary-300">{quote}</p>
        <p className="font-body text-[11px] text-muted">{footerNote(signedIn)}</p>
      </div>
    </footer>
  );
}
