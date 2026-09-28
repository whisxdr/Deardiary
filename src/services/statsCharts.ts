import { eachDayOfInterval, parseISO, startOfWeek, subDays } from 'date-fns';
import { MOODS } from '@/constants';
import { countBy, toDateKey } from '@/utils';
import type { Entry, HeatmapCell, HourBucket, MoodCount, TagCount, WeeklyPoint } from '@/types';

const DAYS_IN_HEATMAP = 182;
const HEATMAP_LEVELS = 4;

/** Entries per week for the trailing `weeks` weeks. */
export function computeWeeklyActivity(entries: Entry[], weeks = 8): WeeklyPoint[] {
  const points: WeeklyPoint[] = [];
  for (let index = weeks - 1; index >= 0; index -= 1) {
    const weekStart = startOfWeek(subDays(new Date(), index * 7));
    const weekEnd = new Date(weekStart.getTime() + 6 * 86_400_000);
    const inWeek = entries.filter((entry) => {
      const time = parseISO(entry.date).getTime();
      return time >= weekStart.getTime() && time <= weekEnd.getTime();
    });
    points.push({
      week: toDateKey(weekStart).slice(5),
      entries: inWeek.length,
      words: inWeek.reduce((total, entry) => total + entry.wordCount, 0),
    });
  }
  return points;
}

/** Entry counts bucketed by hour of day. */
export function computeActivityByHour(entries: Entry[]): HourBucket[] {
  const buckets: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    entries: 0,
  }));
  entries.forEach((entry) => {
    buckets[parseISO(entry.date).getHours()].entries += 1;
  });
  return buckets;
}

/** GitHub-style contribution heatmap for the trailing six months. */
export function computeHeatmap(entries: Entry[]): HeatmapCell[] {
  const counts = countBy(entries, (entry) => toDateKey(entry.date));
  const days = eachDayOfInterval({ start: subDays(new Date(), DAYS_IN_HEATMAP), end: new Date() });
  const max = Math.max(1, ...Object.values(counts));
  return days.map((day) => {
    const date = toDateKey(day);
    const count = counts[date] ?? 0;
    return { date, count, level: count === 0 ? 0 : Math.ceil((count / max) * HEATMAP_LEVELS) };
  });
}

/** Mood tally with labels, colors and percentages, ranked by frequency. */
export function computeMoodDistribution(entries: Entry[]): MoodCount[] {
  const counts = countBy(entries, (entry) => entry.mood);
  const total = entries.length || 1;
  return MOODS.map((mood) => ({
    mood: mood.id,
    label: mood.label,
    color: mood.color,
    count: counts[mood.id] ?? 0,
    percentage: Math.round(((counts[mood.id] ?? 0) / total) * 100),
  }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** Most used tags, ranked by frequency. */
export function computePopularTags(entries: Entry[], limit = 18): TagCount[] {
  const counts = entries.reduce<Record<string, number>>((acc, entry) => {
    entry.tags.forEach((tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1;
    });
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}
