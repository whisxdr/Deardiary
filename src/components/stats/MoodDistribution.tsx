import { MoodPieChart } from '@/components/charts';
import { MoodIcon } from '@/components/mood';
import type { MoodCount } from '@/types';

export interface MoodDistributionProps {
  data: MoodCount[];
}

/** Donut chart plus a legend listing each mood's share. */
export function MoodDistribution({ data }: MoodDistributionProps) {
  if (data.length === 0) {
    return <p className="font-body text-sm text-muted">Write an entry to see your mood mix.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <MoodPieChart data={data} />
      <ul className="grid grid-cols-2 gap-1">
        {data.map((item) => (
          <li key={item.mood} className="flex items-center gap-2 font-body text-xs text-primary-600 dark:text-primary-200">
            <MoodIcon mood={item.mood} size={14} color={item.color} />
            {`${item.label} · ${item.percentage}%`}
          </li>
        ))}
      </ul>
    </div>
  );
}
