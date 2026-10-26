import { useCallback, useEffect, useRef, useState } from 'react';
import { useKeyboard, usePrefersReducedMotion } from '@/hooks';
import { cn } from '@/utils';
import { Stardust } from './Stardust';
import { randomSplashQuote } from './quotes';
import { SplashGreeting } from './SplashGreeting';
import { SplashSkipButton } from './SplashSkipButton';
import { AUTO_EXIT_MS, REDUCED_MOTION_MS, hasSeenSplash, markSplashSeen } from './splashSession';

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
export function SplashScreen({ onComplete, duration = AUTO_EXIT_MS, oncePerSession = false }: SplashScreenProps) {
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

      <SplashGreeting quote={quote} />

      <SplashSkipButton onSkip={finish} />

      <p role="status" className="sr-only font-display">
        Opening Dear Diary
      </p>
    </div>
  );
}
