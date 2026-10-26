import type { ReactElement } from 'react';
import { ActivityBarChart, HeatmapChart } from '@/components/charts';
import {
  FavoritesValue,
  LedgerRow,
  MoodDistribution,
  TagIndex,
  TopMoodValue,
  TotalEntriesValue,
  TotalWordsValue,
  WeeklyAverageValue,
  WritingStreak,
} from '@/components/stats';
import { formatCount } from '@/lib';
import type { StatsSummary } from '@/types';
import { LEDGER_NOTES } from './ledgerNotes';

const SUBLABEL = 'font-body text-sm text-primary-600 dark:text-primary-200';

/**
 * The ten ledger rows, in reading order: number, label, margin copy, body.
 *
 * Returned as an array of `LedgerRow` elements rather than wrapped in a component,
 * because `LedgerSheet` reads `marginNote` off each direct child to build the margin
 * column. A wrapper component would hide that prop and the notes would vanish.
 */
export function ledgerRows(stats: StatsSummary, onTagClick: (tag: string) => void): ReactElement[] {
  const activeDays = stats.heatmap.filter((cell) => cell.count > 0).length;

  return [
    <LedgerRow key="01" number="01" label="Total entries" marginNote={LEDGER_NOTES.total}>
      <TotalEntriesValue stats={stats} />
    </LedgerRow>,
    <LedgerRow key="02" number="02" label="Writing streak" marginNote={LEDGER_NOTES.streak}>
      <WritingStreak current={stats.writingStreak} longest={stats.longestStreak} />
    </LedgerRow>,
    <LedgerRow key="03" number="03" label="Top mood" marginNote={LEDGER_NOTES.topMood}>
      <TopMoodValue mood={stats.topMood} />
    </LedgerRow>,
    <LedgerRow key="04" number="04" label="Total words" marginNote={LEDGER_NOTES.words}>
      <TotalWordsValue total={stats.totalWords} average={stats.averageWords} />
    </LedgerRow>,
    <LedgerRow
      key="05"
      number="05"
      label="Average per week"
      sublabel={<span className={SUBLABEL}>based on the last eight weeks</span>}
      marginNote={LEDGER_NOTES.weekly}
      bodyClassName="items-stretch"
    >
      <WeeklyAverageValue average={stats.averagePerWeek} weekly={stats.weeklyActivity} />
    </LedgerRow>,
    <LedgerRow
      key="06"
      number="06"
      label="Mood distribution"
      sublabel={<span className={SUBLABEL}>how your feelings split up</span>}
      marginNote={LEDGER_NOTES.moodSplit}
    >
      <MoodDistribution data={stats.moodDistribution} />
    </LedgerRow>,
    <LedgerRow
      key="07"
      number="07"
      label="Activity by hour"
      sublabel={<span className={SUBLABEL}>your most productive hour</span>}
      marginNote={LEDGER_NOTES.hour}
      bodyClassName="items-stretch"
    >
      <ActivityBarChart data={stats.activityByHour} />
    </LedgerRow>,
    <LedgerRow key="08" number="08" label="Popular tags" marginNote={LEDGER_NOTES.tags} bodyClassName="items-start">
      <TagIndex tags={stats.popularTags} onTagClick={onTagClick} />
    </LedgerRow>,
    <LedgerRow key="09" number="09" label="Favorites" marginNote={LEDGER_NOTES.favorites}>
      <FavoritesValue count={stats.favorites} />
    </LedgerRow>,
    <LedgerRow
      key="10"
      number="10"
      label="Writing activity"
      sublabel={<span className={SUBLABEL}>{`${formatCount(activeDays, 'active day')} · each square is a day`}</span>}
      marginNote={LEDGER_NOTES.activity}
      bodyClassName="items-stretch"
    >
      <HeatmapChart cells={stats.heatmap} />
    </LedgerRow>,
  ];
}
