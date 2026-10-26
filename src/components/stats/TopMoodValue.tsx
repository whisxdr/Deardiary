import { formatPercent } from '@/lib';
import type { StatsSummary } from '@/types';
import { MoodStamp } from './MoodStamp';

/** Dominant mood stamp and its share, as the body of ledger row 03. */
export function TopMoodValue({ mood }: { mood: StatsSummary['topMood'] }) {
  if (!mood) {
    return <span className="font-body text-sm text-primary-600 dark:text-primary-200">No moods recorded yet</span>;
  }

  return (
    <>
      <MoodStamp mood={mood} />
      <span className="font-body text-sm text-primary-600 dark:text-primary-200">
        {`${formatPercent(mood.percentage)} of all entries · your most common feeling`}
      </span>
    </>
  );
}
