import { formatCount } from '@/lib';
import { signed } from '@/utils';
import type { StatsSummary } from '@/types';
import { StatNumber } from './StatNumber';

/** Headline count plus this month's delta, as the body of ledger row 01. */
export function TotalEntriesValue({ stats }: { stats: StatsSummary }) {
  return (
    <>
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
    </>
  );
}
