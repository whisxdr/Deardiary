import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { STORAGE_NAMESPACE } from '@/constants';
import { useKeyboard, usePrefersReducedMotion } from '@/hooks';
import { CelestialStars, Stardust } from './CelestialStars';
import { randomSplashQuote } from './quotes';

/** Session flag, so the opening can be limited to the first visit of a session. */
const SPLASH_SESSION_KEY = `${STORAGE_NAMESPACE}:splash-shown`;

/** Time on screen before the opening fades itself out. */
const AUTO_EXIT_MS = 5_500;

/** A visitor who asked for reduced motion gets the still card, not a five second wait. */
const REDUCED_MOTION_MS = 1_400;

/** Shared easing: the same curve the dialog transitions already use. */
const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
  const [visible, setVisible] = useState(true);
  const finish = useCallback(() => setVisible(false), []);

  const stayMs = reducedMotion ? REDUCED_MOTION_MS : duration;

  // A returning visitor is waved straight through: `onComplete` unmounts this component
  // in the same tick, so nothing of the opening ever paints.
  useEffect(() => {
    if (skipped) onComplete();
  }, [onComplete, skipped]);

  useEffect(() => {
    if (skipped) return;
    if (oncePerSession) markSplashSeen();
    const timer = window.setTimeout(finish, stayMs);
    return () => window.clearTimeout(timer);
  }, [finish, oncePerSession, skipped, stayMs]);

  useKeyboard([{ key: 'Escape', handler: finish }], visible && !skipped);

  if (skipped) return null;

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible ? (
        <motion.div
          key="splash"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-primary-900 px-6"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: reducedMotion ? 1 : 1.04,
            transition: { duration: reducedMotion ? 0 : 0.8, ease: EASE_OUT_EXPO },
          }}
          transition={{ duration: reducedMotion ? 0 : 0.6 }}
        >
          {/* Warm vignette over the night ground. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,97,0.16),transparent_62%)]"
          />
          <Stardust />

          <div className="relative flex flex-col items-center gap-6">
            <motion.div
              className="h-[min(58vw,280px)] w-[min(58vw,280px)]"
              initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1, y: reducedMotion ? 0 : [0, -20] }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      opacity: { duration: 1.4, ease: EASE_OUT_EXPO },
                      scale: { duration: 1.4, ease: EASE_OUT_EXPO },
                      y: { delay: 2, duration: 1.4, ease: EASE_OUT_EXPO },
                    }
              }
            >
              <CelestialStars />
            </motion.div>

            <motion.h1
              className="font-display text-3xl tracking-[0.08em] text-accent-cream [text-shadow:0_0_28px_rgba(201,169,97,0.35)] sm:text-4xl md:text-5xl"
              initial={reducedMotion ? false : { opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={
                reducedMotion ? { duration: 0 } : { delay: 2.2, duration: 1.2, ease: EASE_OUT_EXPO }
              }
            >
              Welcome to Dear Diary
            </motion.h1>

            <motion.figure
              className="flex max-w-xl flex-col items-center gap-3 text-center"
              initial={reducedMotion ? false : { opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={
                reducedMotion ? { duration: 0 } : { delay: 3.4, duration: 1.2, ease: EASE_OUT_EXPO }
              }
            >
              <span
                aria-hidden="true"
                className="h-px w-16 bg-gradient-to-r from-transparent via-accent-gold/60 to-transparent"
              />
              <blockquote className="font-sub text-base italic leading-relaxed text-accent-gold/90 sm:text-lg">
                &ldquo;{quote}&rdquo;
              </blockquote>
            </motion.figure>
          </div>

          <button
            type="button"
            autoFocus
            onClick={finish}
            aria-label="Skip the opening"
            className="absolute right-4 top-4 min-h-[44px] rounded-full border border-accent-gold/30 bg-accent-gold/10 px-5 font-body text-xs uppercase tracking-[0.2em] text-accent-cream/75 backdrop-blur-sm transition-colors duration-fast hover:border-accent-gold/50 hover:bg-accent-gold/20 hover:text-accent-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold sm:right-6 sm:top-6"
          >
            Skip
          </button>

          <p role="status" className="sr-only">
            Opening Dear Diary
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
