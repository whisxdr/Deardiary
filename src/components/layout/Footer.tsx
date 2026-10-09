import { APP_CONFIG, QUOTES, quoteForDate } from '@/constants';

/** Quiet footer with a rotating quote and the app version. */
export function Footer() {
  const quote = quoteForDate(new Date()) || QUOTES[0];

  return (
    <footer className="border-t border-primary-200/60 bg-primary-50/60 py-6 dark:border-primary-700 dark:bg-primary-900/40">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-1 px-4 text-center">
        <p className="font-hand text-lg text-muted dark:text-primary-300">{quote}</p>
        <p className="font-body text-[11px] text-muted">{`${APP_CONFIG.name} v${APP_CONFIG.version} — your words stay on this device.`}</p>
      </div>
    </footer>
  );
}
