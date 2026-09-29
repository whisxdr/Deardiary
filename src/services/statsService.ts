import { parseISO } from 'date-fns';
import type { Entry, StatsSummary } from '@/types';
import {
  computeActivityByHour,
  computeHeatmap,
  computeMoodDistribution,
  computePopularTags,
  computeWeeklyActivity,
} from './statsCharts';
import { computeLongestStreak, computeStreak } from './statsStreaks';
import { listEntries } from './entryService';

/** Entries in the current calendar month. */
function entriesInMonth(entries: Entry[], date: Date): Entry[] {
  return entries.filter((entry) => {
    const parsed = parseISO(entry.date);
    return parsed.getMonth() === date.getMonth() && parsed.getFullYear() === date.getFullYear();
  });
}

/** Percentage change between this month and the previous one. */
function monthChange(thisMonth: number, lastMonth: number): number {
  if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
  return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
}

/** Builds the full stats payload the stats page renders. */
export function computeStats(source: Entry[] = listEntries()): StatsSummary {
  const now = new Date();
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonth = entriesInMonth(source, now);
  const lastMonth = entriesInMonth(source, previousMonthDate);
  const totalWords = source.reduce((total, entry) => total + entry.wordCount, 0);
  const moodDistribution = computeMoodDistribution(source);
  const weeks = computeWeeklyActivity(source);
  // The card is labelled "Based on the last eight weeks", so average that window
  // rather than dividing the all-time total by eight.
  const recentEntries = weeks.reduce((total, week) => total + week.entries, 0);

  return {
    totalEntries: source.length,
    totalWords,
    favorites: source.filter((entry) => entry.isFavorite).length,
    writingStreak: computeStreak(source),
    longestStreak: computeLongestStreak(source),
    entriesThisMonth: thisMonth.length,
    entriesLastMonth: lastMonth.length,
    monthChangePercent: monthChange(thisMonth.length, lastMonth.length),
    averagePerWeek: weeks.length ? Number((recentEntries / weeks.length).toFixed(1)) : 0,
    averageWords: source.length ? Math.round(totalWords / source.length) : 0,
    topMood: moodDistribution[0] ?? null,
    moodDistribution,
    weeklyActivity: weeks,
    activityByHour: computeActivityByHour(source),
    heatmap: computeHeatmap(source),
    popularTags: computePopularTags(source),
  };
}
