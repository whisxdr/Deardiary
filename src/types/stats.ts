import type { Mood } from './entry';

/** Aggregated mood statistics. */
export interface MoodCount {
  mood: Mood;
  label: string;
  color: string;
  count: number;
  percentage: number;
}

/** One point of the entries-per-week line chart. */
export interface WeeklyPoint {
  week: string;
  entries: number;
  words: number;
}

/** One bucket of the activity-by-hour bar chart. */
export interface HourBucket {
  hour: number;
  label: string;
  entries: number;
}

/** One point of the GitHub-style contribution heatmap. */
export interface HeatmapCell {
  date: string;
  count: number;
  level: number;
}

/** Tag usage frequency. */
export interface TagCount {
  tag: string;
  count: number;
}

/** Everything the stats page renders. */
export interface StatsSummary {
  totalEntries: number;
  totalWords: number;
  favorites: number;
  writingStreak: number;
  longestStreak: number;
  entriesThisMonth: number;
  entriesLastMonth: number;
  monthChangePercent: number;
  averagePerWeek: number;
  averageWords: number;
  topMood: MoodCount | null;
  moodDistribution: MoodCount[];
  weeklyActivity: WeeklyPoint[];
  activityByHour: HourBucket[];
  heatmap: HeatmapCell[];
  popularTags: TagCount[];
}
