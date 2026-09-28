import { FileText, Star, TrendUp, TextT } from '@phosphor-icons/react';
import { StatCard, StatNumber, WordCloud, WritingStreak } from '@/components/stats';
import { ActivityBarChart, EntriesLineChart, HeatmapChart } from '@/components/charts';
import { MoodDistribution } from '@/components/stats';
import { MoodIcon } from '@/components/mood';
import { formatCount, formatPercent, formatWordCount } from '@/lib';
import { moodLabel, signed } from '@/utils';
import type { StatsSummary } from '@/types';

export interface StatsGridProps {
  stats: StatsSummary;
  onTagClick: (tag: string) => void;
}

/** Dashboard of every statistic the diary can compute locally. */
export function StatsGrid({ stats, onTagClick }: StatsGridProps) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-3">
      <StatCard
        label="Total entries"
        value={<StatNumber value={stats.totalEntries} />}
        hint={`${formatCount(stats.entriesThisMonth, 'entry', 'entries')} this month`}
        icon={<FileText size={20} weight="regular" />}
      >
        <p className="font-body text-xs text-primary-500 dark:text-primary-300">
          {`${signed(stats.monthChangePercent)}% vs last month`}
        </p>
      </StatCard>

      <StatCard label="Writing streak" value={<span className="sr-only">{stats.writingStreak}</span>} hint="Consecutive days with an entry">
        <WritingStreak current={stats.writingStreak} longest={stats.longestStreak} />
      </StatCard>

      <StatCard
        label="Top mood"
        value={stats.topMood ? stats.topMood.label : 'No data'}
        hint={stats.topMood ? `${formatPercent(stats.topMood.percentage)} of all entries` : 'No moods recorded yet'}
        icon={stats.topMood ? <MoodIcon mood={stats.topMood.mood} size={20} color={stats.topMood.color} /> : <Star size={20} weight="regular" />}
      />

      <StatCard
        label="Total words"
        value={<StatNumber value={stats.totalWords} />}
        hint={`${formatWordCount(stats.averageWords)} per entry on average`}
        icon={<TextT size={20} weight="regular" />}
      />

      <StatCard
        label="Average per week"
        value={stats.averagePerWeek}
        hint="Based on the last eight weeks"
        icon={<TrendUp size={20} weight="regular" />}
      >
        <EntriesLineChart data={stats.weeklyActivity} />
      </StatCard>

      <StatCard label="Mood distribution" value={`${stats.moodDistribution.length} moods`} hint="How your feelings split up">
        <MoodDistribution data={stats.moodDistribution} />
      </StatCard>

      <StatCard
        label="Activity by hour"
        value={stats.activityByHour.reduce((peak, hour) => (hour.entries > peak.entries ? hour : peak), stats.activityByHour[0]).label}
        hint="Your most productive hour"
      >
        <ActivityBarChart data={stats.activityByHour} />
      </StatCard>

      <StatCard
        label="Popular tags"
        value={`${stats.popularTags.length} tags`}
        hint={stats.topMood ? `Favorite feeling: ${moodLabel(stats.topMood.mood)}` : undefined}
        className="lg:col-span-2"
      >
        <WordCloud tags={stats.popularTags} onTagClick={onTagClick} />
      </StatCard>

      <StatCard label="Favorites" value={<StatNumber value={stats.favorites} />} hint="Entries you starred" />

      <StatCard label="Writing activity" value={`${stats.heatmap.filter((cell) => cell.count > 0).length} active days`} className="lg:col-span-3">
        <HeatmapChart cells={stats.heatmap} />
      </StatCard>
    </div>
  );
}
