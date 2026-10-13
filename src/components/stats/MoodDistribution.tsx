import { formatPercent } from '@/lib';
import type { MoodCount } from '@/types';

export interface MoodDistributionProps {
  data: MoodCount[];
}

/** Widest bar in the list, so the longest row reads as 100% of the scale. */
function maxPercentage(data: MoodCount[]): number {
  return data.reduce((max, item) => Math.max(max, item.percentage), 0);
}

/**
 * Mood distribution as a ledger bar list.
 *
 * A ledger records rows, so this replaces the donut: one row per mood carrying
 * swatch, name, a proportional bar and the exact percentage. Every value is
 * readable as text, which the donut plus cramped two-column legend could not do.
 * The list carries a single `aria-label` enumerating the distribution.
 */
export function MoodDistribution({ data }: MoodDistributionProps) {
  if (data.length === 0) {
    return <p className="font-body text-sm text-muted">Write an entry to see your mood mix.</p>;
  }

  const scale = maxPercentage(data) || 1;
  const summary = data.map((item) => `${item.label} ${formatPercent(item.percentage)}`).join(', ');

  return (
    <ul
      role="img"
      aria-label={`Mood distribution: ${summary}`}
      className="flex min-w-[220px] flex-1 flex-col gap-1"
    >
      {data.map((item) => (
        <li key={item.mood} className="grid grid-cols-[14px_92px_1fr_44px] items-center gap-2.5">
          <span
            aria-hidden="true"
            className="size-3.5 rounded-sm border border-primary-700/25 dark:border-primary-100/25"
            style={{ background: item.color }}
          />
          <span className="truncate font-body text-sm text-primary-600 dark:text-primary-200">{item.label}</span>
          <span className="h-2 overflow-hidden rounded-sm bg-primary-200 dark:bg-primary-600">
            <span
              className="block h-full rounded-sm"
              style={{ width: `${Math.max(2, (item.percentage / scale) * 100)}%`, background: item.color }}
            />
          </span>
          <span className="text-right font-mono text-[13px] text-primary-600 dark:text-primary-200">{formatPercent(item.percentage)}</span>
        </li>
      ))}
    </ul>
  );
}
