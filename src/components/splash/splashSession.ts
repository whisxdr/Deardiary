import { STORAGE_NAMESPACE } from '@/constants';

/** Session flag, so the opening can be limited to the first visit of a session. */
const SPLASH_SESSION_KEY = `${STORAGE_NAMESPACE}:splash-shown`;

/** Time on screen before the opening fades itself out. */
export const AUTO_EXIT_MS = 5_500;

/** A visitor who asked for reduced motion gets the still card, not a five second wait. */
export const REDUCED_MOTION_MS = 1_400;

/** Start of the lift, kept in step with `splash-lift` in tailwind.config.js. */
export const LIFT_DELAY_S = 2;

/** Greeting and quote reveal one after the other; same table as `splash-rise`. */
export const TITLE_DELAY_S = 2.2;
export const QUOTE_DELAY_S = 3.4;

/** True when this browser session already sat through the opening. */
export function hasSeenSplash(): boolean {
  try {
    return window.sessionStorage.getItem(SPLASH_SESSION_KEY) === '1';
  } catch {
    // Storage can be blocked, in which case every visit gets the opening.
    return false;
  }
}

export function markSplashSeen(): void {
  try {
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
  } catch {
    // Same as above; a refused write is not worth failing a launch over.
  }
}
