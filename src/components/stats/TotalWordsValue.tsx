import { formatWordCount } from '@/lib';
import { StatNumber } from './StatNumber';

/** Word total and the per-entry average, as the body of ledger row 04. */
export function TotalWordsValue({ total, average }: { total: number; average: number }) {
  return (
    <>
      <span className="font-display text-[44px] leading-none font-bold tracking-tight text-primary-800 dark:text-primary-100">
        <StatNumber value={total} />
        <span className="font-sub text-lg font-medium text-primary-600 italic dark:text-primary-200">words</span>
      </span>
      <span className="font-body text-sm text-primary-600 dark:text-primary-200">
        {`${formatWordCount(average)} per entry on average`}
      </span>
    </>
  );
}
