import type { ReactNode } from 'react';

const arrow = <span aria-hidden="true">&rarr;</span>;

/**
 * Handwritten margin copy for each ledger row.
 *
 * Kept out of `StatsGrid` so the page reads as a table of contents: which row, in what
 * order, carrying which value. The notes are design copy, not layout.
 */
export const LEDGER_NOTES: Record<string, ReactNode> = {
  total: <>every page you turned {arrow} a year of them</>,
  streak: <>don&apos;t break the chain {arrow} the flame holds</>,
  topMood: <>the feeling you reach for {arrow} stamped &amp; sealed</>,
  words: <>ink spent {arrow} word by word</>,
  weekly: <>a steady hand {arrow} week by week</>,
  moodSplit: <>the weather of your year {arrow} all twelve moods</>,
  hour: <>when the pen moves {arrow} evening, mostly</>,
  tags: <>threads you return to {arrow} tap to filter</>,
  favorites: <>the keepers {arrow} starred pages</>,
  activity: <>the whole year, squared {arrow} one page of days</>,
};
