import { EntriesLineChart } from '@/components/charts';
import type { StatsSummary } from '@/types';

export interface WeeklyAverageValueProps {
  average: number;
  weekly: StatsSummary['weeklyActivity'];
}

/** Per-week average with the eight-week sparkline, as the body of ledger row 05. */
export function WeeklyAverageValue({ average, weekly }: WeeklyAverageValueProps) {
  return (
    <>
      <span className="font-display text-[34px] leading-none font-bold tracking-tight text-primary-800 dark:text-primary-100">
        {average}
        <span className="ml-1.5 font-sub text-base font-medium text-primary-600 italic dark:text-primary-200">/ week</span>
      </span>
      <EntriesLineChart data={weekly} />
    </>
  );
}
