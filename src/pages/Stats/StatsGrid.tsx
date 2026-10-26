import { LedgerSheet, StatsMargin } from '@/components/stats';
import type { StatsSummary } from '@/types';
import { ledgerRows } from './ledgerRows';

export interface StatsGridProps {
  stats: StatsSummary;
  onTagClick: (tag: string) => void;
}

/**
 * The statistics page as a single continuous ledger: one ruled sheet of ten numbered
 * rows, read top to bottom.
 *
 * Composition only. The rows themselves are built in `ledgerRows`, and each row's body
 * lives in `components/stats`.
 */
export function StatsGrid({ stats, onTagClick }: StatsGridProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Margin furniture for the gutters either side of the sheet. Fixed and
          pointer-events:none, so it adds no layout and never blocks the sheet. */}
      <StatsMargin />
      <LedgerSheet>{ledgerRows(stats, onTagClick)}</LedgerSheet>
      <p className="font-hand text-xl text-primary-600 dark:text-primary-200">
        <span aria-hidden="true">* </span>
        every figure tallied from entries kept in this browser.
      </p>
    </div>
  );
}
