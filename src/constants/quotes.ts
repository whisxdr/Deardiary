/** Rotating quotes shown on the cover page footer. */
export const QUOTES: string[] = [
  'Every page is your story.',
  'A diary is a mirror that remembers.',
  'Write it down before the day forgets.',
  'Small days make a long life.',
  'The ink knows what the mind hides.',
  'One honest line beats a perfect paragraph.',
  'Your future self is an eager reader.',
  'Feelings fade; paper does not.',
  'Today deserves a sentence.',
  'Begin badly, but begin.',
  'The blank page is not your enemy.',
  'Memories are lighter once written.',
  'Notice more, note more.',
  'There is no wrong way to keep a diary.',
  'Some days are chapters, some are commas.',
  'Write like nobody will grade it.',
  'A page a day keeps the blur away.',
  'You are the only author of this book.',
  'Quiet hours write the loudest entries.',
  'Keep the ordinary; it becomes precious.',
  'Thoughts untangled become words.',
  'The best time to write is now.',
  'Your life is worth the ink.',
];

/**
 * Rotates the quote list so a new quote shows each day.
 *
 * The day index comes from local calendar parts: dividing a UTC timestamp by a day
 * changes the quote at UTC midnight, which is mid-afternoon for users well ahead of UTC.
 */
export function quoteForDate(date: Date): string {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return QUOTES[((dayNumber % QUOTES.length) + QUOTES.length) % QUOTES.length];
}
