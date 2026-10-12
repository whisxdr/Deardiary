import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_NAMESPACE } from '@/constants';
import { useKeyboard, usePrefersReducedMotion } from '@/hooks';
import { cn } from '@/utils';
import { CelestialStars, Stardust } from './CelestialStars';
import { randomSplashQuote } from './quotes';

/** Session flag, so the opening can be limited to the first visit of a session. */
const SPLASH_SESSION_KEY = `${STORAGE_NAMESPACE}:splash-shown`;

/** Time on screen before the opening fades itself out. */
const AUTO_EXIT_MS = 5_500;

/** A visitor who asked for reduced motion gets the still card, not a five second wait. */
const REDUCED_MOTION_MS = 1_400;

/** Start of the lift, kept in step with `splash-lift` in tailwind.config.js. */
const LIFT_DELAY_S = 2;

/** Greeting and quote reveal one after the other; same table as `splash-rise`. */
const TITLE_DELAY_S = 2.2;
const QUOTE_DELAY_S = 3.4;

function hasSeenSplash(): boolean {
  try {
    return window.sessionStorage.getItem(SPLASH_SESSION_KEY) === '1';
  } catch {
    // Storage can be blocked, in which case every visit gets the opening.
    return false;
  }
}

function markSplashSeen(): void {
  try {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
  } catch {
    // Same as above; a refused write is not worth failing a launch over.
  }
}

export interface SplashScreenProps {
  /** Called once the opening has faded out and can be unmounted. */
  onComplete: () => void;
  /** Time on screen before the automatic fade-out, in milliseconds. Defaults to 5500. */
  duration?: number;
  /** Show the opening only on the first visit of a browser session. */
  oncePerSession?: boolean;
}

/**
 * Cinematic opening: a star system drifts, the greeting surfaces, then the whole screen
 * fades and hands over through `onComplete`.
 *
 * The animation is CSS, not Framer Motion. This is the first screen every visitor paints,
 * so the library was the single largest thing on the critical path, and four keyframes do
 * the same work with nothing to parse. `prefers-reduced-motion` is handled for free by the
 * global rule that collapses animation durations, which lands every keyframe on its end
 * state; the only thing left to do here is leave sooner.
 *
 * The main app stays mounted behind this overlay, so the fade reveals a page that has
 * already painted and its lazy route chunk has already loaded.
 */
export function SplashScreen({
  onComplete,
  duration = AUTO_EXIT_MS,
  oncePerSession = false,
}: SplashScreenProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [skipped] = useState(() => oncePerSession && hasSeenSplash());
  const [quote] = useState(randomSplashQuote);
  const [leaving, setLeaving] = useState(false);
  // index.html painted this frame before any script ran. Fading in over it would blink
  // the star the visitor is already looking at, so the opening starts visible instead.
  const [shellPainted] = useState(() => document.documentElement.dataset.splash === 'shell');
  const completed = useRef(false);

  const complete = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    onComplete();
  }, [onComplete]);

  const finish = useCallback(() => setLeaving(true), []);

  // Take the static shell down as soon as this component owns the screen.
  useEffect(() => {
    document.getElementById('splash-shell')?.remove();
    document.documentElement.dataset.splash = skipped ? 'skip' : 'done';
  }, [skipped]);

  // A returning visitor is waved straight through: nothing of the opening ever paints.
  useEffect(() => {
    if (skipped) complete();
  }, [complete, skipped]);

  useEffect(() => {
    if (skipped) return;
    if (oncePerSession) markSplashSeen();
    const timer = window.setTimeout(finish, reducedMotion ? REDUCED_MOTION_MS : duration);
    return () => window.clearTimeout(timer);
  }, [duration, finish, oncePerSession, reducedMotion, skipped]);

  useKeyboard([{ key: 'Escape', handler: finish }], !skipped && !leaving);

  if (skipped) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-primary-900 px-6',
        leaving ? 'animate-splash-out' : !shellPainted && 'animate-splash-fade',
      )}
      // The exit animation is the only signal that the handover is done; the guard in
      // `complete` keeps a re-run from calling `onComplete` twice.
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && leaving) complete();
      }}
    >
      {/* Warm vignette over the night ground. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,97,0.16),transparent_62%)]"
      />
      <Stardust />

      {/*
        The star sits exactly on the viewport centre, where the static shell drew it, and
        the greeting hangs below it. Both match the shell's geometry, so the handover moves
        nothing.
      */}
      <div className="relative flex flex-col items-center">
        <div
          className="h-[min(58vw,280px,44vh)] w-[min(58vw,280px,44vh)] [will-change:transform] motion-safe:animate-splash-lift"
          style={{ animationDelay: `${LIFT_DELAY_S}s` }}
        >
          <CelestialStars />
        </div>

        <div className="absolute left-1/2 top-full flex w-[min(88vw,40rem)] -translate-x-1/2 flex-col items-center gap-4 pt-6 text-center">
          <h1
            className="animate-splash-rise font-display text-3xl tracking-[0.08em] text-accent-cream [text-shadow:0_0_28px_rgba(201,169,97,0.35)] sm:text-4xl md:text-5xl"
            style={{ animationDelay: `${TITLE_DELAY_S}s` }}
          >
            Welcome to Dear Diary
          </h1>

          <figure
            className="animate-splash-rise flex flex-col items-center gap-3"
            style={{ animationDelay: `${QUOTE_DELAY_S}s` }}
          >
            <span
              aria-hidden="true"
              className="h-px w-16 bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
            />
            <blockquote className="font-sub text-base italic leading-relaxed text-accent-gold/90 sm:text-lg">
              &ldquo;{quote}&rdquo;
            </blockquote>
          </figure>
        </div>
      </div>

      {/* Serif-only screen: an Inter glyph here fetches the 39 KB body font while the
          entry chunk is still arriving. */}
      <button
        type="button"
        autoFocus
        onClick={finish}
        aria-label="Skip the opening"
        className="absolute right-4 top-4 min-h-[44px] rounded-full border border-accent-gold/30 bg-accent-gold/10 px-5 font-display text-xs uppercase tracking-[0.2em] text-accent-cream/75 backdrop-blur-sm transition-colors duration-fast hover:border-accent-gold/50 hover:bg-accent-gold/20 hover:text-accent-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold sm:right-6 sm:top-6"
      >
        Skip
      </button>

      <p role="status" className="sr-only font-display">
        Opening Dear Diary
      </p>
    </div>
  );
}
