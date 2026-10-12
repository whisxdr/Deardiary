/** A line shown under the welcome title, with its Chinese echo. */
export interface SplashQuote {
  en: string;
  zh: string;
}

/**
 * Curated opening lines.
 *
 * Kept apart from `@/constants/quotes` on purpose: those are the short, everyday lines
 * printed on the cover, while these are the longer lines the opening screen can hold for
 * a few seconds.
 */
export const SPLASH_QUOTES: readonly SplashQuote[] = [
  {
    en: 'The unwritten thoughts are the quietest stars in your night.',
    zh: '心底未着墨的故事，是漫漫长夜里最温柔的星芒',
  },
  {
    en: 'Every page holds a secret universe waiting to unfold.',
    zh: '每一页都藏着一个尚未展开的秘密宇宙',
  },
  {
    en: 'Write gently. Time will turn your whispers into constellations.',
    zh: '落笔轻些，时光自会把你的低语缀成星座',
  },
];

/** One line for this launch, picked at random. */
export function randomSplashQuote(): SplashQuote {
  const index = Math.floor(Math.random() * SPLASH_QUOTES.length);
  return SPLASH_QUOTES[index];
}
