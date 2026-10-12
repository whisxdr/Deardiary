/**
 * Curated opening lines.
 *
 * Kept apart from `@/constants/quotes` on purpose: those are the short, everyday lines
 * printed in the footer, while these are the longer lines the opening screen holds for a
 * few seconds.
 */
export const SPLASH_QUOTES: readonly string[] = [
  'The unwritten thoughts are the quietest stars in your night.',
  'Every page holds a secret universe waiting to unfold.',
  'Write gently. Time will turn your whispers into constellations.',
];

/** One line for this launch, picked at random. */
export function randomSplashQuote(): string {
  return SPLASH_QUOTES[Math.floor(Math.random() * SPLASH_QUOTES.length)];
}
