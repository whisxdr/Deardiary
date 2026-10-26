export interface SplashSkipButtonProps {
  onSkip: () => void;
}

/**
 * The skip control, pinned to the top-right corner.
 *
 * Serif-only screen: an Inter glyph here would fetch the 39 KB body font while the entry
 * chunk is still arriving.
 */
export function SplashSkipButton({ onSkip }: SplashSkipButtonProps) {
  return (
    <button
      type="button"
      autoFocus
      onClick={onSkip}
      aria-label="Skip the opening"
      className="absolute right-4 top-4 min-h-[44px] rounded-full border border-accent-gold/30 bg-accent-gold/10 px-5 font-display text-xs uppercase tracking-[0.2em] text-accent-cream/75 backdrop-blur-sm transition-colors duration-fast hover:border-accent-gold/50 hover:bg-accent-gold/20 hover:text-accent-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold sm:right-6 sm:top-6"
    >
      Skip
    </button>
  );
}
