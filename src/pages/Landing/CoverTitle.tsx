import { APP_CONFIG } from '@/constants';

/** Gilt-embossed wordmark at the top of the cover. */
export function CoverTitle() {
  return (
    <div className="flex flex-col items-center gap-2">
      <h1 className="font-display text-5xl font-bold tracking-wide text-accent-gold drop-shadow-[0_2px_2px_rgba(26,15,10,0.9)] sm:text-7xl">
        {APP_CONFIG.name}
      </h1>
      <p className="font-sub text-xl italic text-primary-100/85 sm:text-2xl">Every page is your story</p>
    </div>
  );
}
