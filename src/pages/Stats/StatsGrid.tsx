import { Star } from '@phosphor-icons/react';
import { LedgerRow, LedgerSheet, MoodDistribution, MoodStamp, StatNumber, StatsMargin, TagIndex, WritingStreak } from '@/components/stats';
import { ActivityBarChart, EntriesLineChart, HeatmapChart } from '@/components/charts';
import { formatCount, formatPercent, formatWordCount } from '@/lib';
import { signed } from '@/utils';
import type { StatsSummary } from '@/types';

export interface StatsGridProps {
  stats: StatsSummary;
  onTagClick: (tag: string) => void;
}

/** Row 01 of the ledger: the headline count, with this month's delta. */
function TotalEntriesRow({ stats }: { stats: StatsSummary }) {
  return (
    <LedgerRow
      number="01"
      label="Total entries"
      marginNote={<>every page you turned <span aria-hidden="true">&rarr;</span> a year of them</>}
    >
      <span className="font-display text-[44px] leading-none font-bold tracking-tight text-primary-800 dark:text-primary-100">
        <StatNumber value={stats.totalEntries} />
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-accent-gold/15 px-2.5 py-1 font-body text-[13px] font-semibold whitespace-nowrap text-accent-gold-deep dark:border-primary-600 dark:text-accent-gold">
        {stats.monthChangePercent >= 0 ? (
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5l7 8h-4v6h-6v-6H5z" />
          </svg>
        ) : (
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 19l-7-8h4V5h6v6h4z" />
          </svg>
        )}
        {`${signed(stats.monthChangePercent)}% vs last month`}
      </span>
      <span className="font-body text-sm text-primary-600 dark:text-primary-200">
        {`${formatCount(stats.entriesThisMonth, 'entry', 'entries')} this month`}
      </span>
    </LedgerRow>
  );
}

/** Row 04 of the ledger: total words written. */
function TotalWordsRow({ stats }: { stats: StatsSummary }) {
  return (
    <LedgerRow
      number="04"
      label="Total words"
      marginNote={<>ink spent <span aria-hidden="true">&rarr;</span> word by word</>}
    >
      <span className="font-display text-[44px] leading-none font-bold tracking-tight text-primary-800 dark:text-primary-100">
        <StatNumber value={stats.totalWords} />
        <span className="font-sub text-lg font-medium text-primary-600 italic dark:text-primary-200">words</span>
      </span>
      <span className="font-body text-sm text-primary-600 dark:text-primary-200">
        {`${formatWordCount(stats.averageWords)} per entry on average`}
      </span>
    </LedgerRow>
  );
}

/** Row 09 of the ledger: starred entries. */
function FavoritesRow({ stats }: { stats: StatsSummary }) {
  return (
    <LedgerRow
      number="09"
      label="Favorites"
      marginNote={<>the keepers <span aria-hidden="true">&rarr;</span> starred pages</>}
    >
      <span className="font-display text-[44px] leading-none font-bold tracking-tight text-primary-800 dark:text-primary-100">
        <StatNumber value={stats.favorites} />
      </span>
      <Star aria-hidden="true" size={26} weight="fill" className="text-accent-gold" />
      <span className="font-body text-sm text-primary-600 dark:text-primary-200">entries you starred</span>
    </LedgerRow>
  );
}

/**
 * The statistics page as a single continuous ledger: one ruled sheet of ten
 * numbered rows, read top to bottom.
 */
export function StatsGrid({ stats, onTagClick }: StatsGridProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Margin furniture for the gutters either side of the sheet. Fixed and
          pointer-events:none, so it adds no layout and never blocks the sheet. */}
      <StatsMargin />
      <LedgerSheet>
        <TotalEntriesRow stats={stats} />
        <LedgerRow
          number="02"
          label="Writing streak"
          marginNote={<>don't break the chain <span aria-hidden="true">&rarr;</span> the flame holds</>}
        >
          <WritingStreak current={stats.writingStreak} longest={stats.longestStreak} />
        </LedgerRow>
        <LedgerRow
          number="03"
          label="Top mood"
          marginNote={<>the feeling you reach for <span aria-hidden="true">&rarr;</span> stamped &amp; sealed</>}
        >
          {stats.topMood ? (
            <>
              <MoodStamp mood={stats.topMood} />
              <span className="font-body text-sm text-primary-600 dark:text-primary-200">
                {`${formatPercent(stats.topMood.percentage)} of all entries · your most common feeling`}
              </span>
            </>
          ) : (
            <span className="font-body text-sm text-primary-600 dark:text-primary-200">No moods recorded yet</span>
          )}
        </LedgerRow>
        <TotalWordsRow stats={stats} />
        <LedgerRow
          number="05"
          label="Average per week"
          sublabel={<span className="font-body text-sm text-primary-600 dark:text-primary-200">based on the last eight weeks</span>}
          marginNote={<>a steady hand <span aria-hidden="true">&rarr;</span> week by week</>}
          bodyClassName="items-stretch"
        >
          <span className="font-display text-[34px] leading-none font-bold tracking-tight text-primary-800 dark:text-primary-100">
            {stats.averagePerWeek}
            <span className="ml-1.5 font-sub text-base font-medium text-primary-600 italic dark:text-primary-200">/ week</span>
          </span>
          <EntriesLineChart data={stats.weeklyActivity} />
        </LedgerRow>
        <LedgerRow
          number="06"
          label="Mood distribution"
          sublabel={<span className="font-body text-sm text-primary-600 dark:text-primary-200">how your feelings split up</span>}
          marginNote={<>the weather of your year <span aria-hidden="true">&rarr;</span> all twelve moods</>}
        >
          <MoodDistribution data={stats.moodDistribution} />
        </LedgerRow>
        <LedgerRow
          number="07"
          label="Activity by hour"
          sublabel={<span className="font-body text-sm text-primary-600 dark:text-primary-200">your most productive hour</span>}
          marginNote={<>when the pen moves <span aria-hidden="true">&rarr;</span> evening, mostly</>}
          bodyClassName="items-stretch"
        >
          <ActivityBarChart data={stats.activityByHour} />
        </LedgerRow>
        <LedgerRow
          number="08"
          label="Popular tags"
          marginNote={<>threads you return to <span aria-hidden="true">&rarr;</span> tap to filter</>}
          bodyClassName="items-start"
        >
          <TagIndex tags={stats.popularTags} onTagClick={onTagClick} />
        </LedgerRow>
        <FavoritesRow stats={stats} />
        <LedgerRow
          number="10"
          label="Writing activity"
          sublabel={
            <span className="font-body text-sm text-primary-600 dark:text-primary-200">
              {`${formatCount(stats.heatmap.filter((cell) => cell.count > 0).length, 'active day')} · each square is a day`}
            </span>
          }
          marginNote={<>the whole year, squared <span aria-hidden="true">&rarr;</span> one page of days</>}
          bodyClassName="items-stretch"
        >
          <HeatmapChart cells={stats.heatmap} />
        </LedgerRow>
      </LedgerSheet>
      <p className="font-hand text-xl text-primary-600 dark:text-primary-200">
        <span aria-hidden="true">* </span>
        every figure tallied from entries kept in this browser.
      </p>
    </div>
  );
}
