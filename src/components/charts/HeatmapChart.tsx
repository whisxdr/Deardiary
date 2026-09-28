import { useMemo } from 'react';
import { toDateKey } from '@/utils/date';
import type { HeatmapCell } from '@/types';

export interface HeatmapChartProps {
  cells: HeatmapCell[];
  title?: string;
}

const LEVEL_CLASSES = [
  'bg-primary-200/60 dark:bg-primary-700/50',
  'bg-accent-sage/40',
  'bg-accent-sage/70',
  'bg-accent-sage',
  'bg-primary-600',
];

/** GitHub-style contribution grid, grouped into weeks. */
export function HeatmapChart({ cells, title = 'Writing activity' }: HeatmapChartProps) {
  const weeks = useMemo(() => {
    const grouped: HeatmapCell[][] = [];
    cells.forEach((cell, index) => {
      const weekIndex = Math.floor(index / 7);
      (grouped[weekIndex] ??= []).push(cell);
    });
    return grouped;
  }, [cells]);

  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <figcaption className="font-body text-xs uppercase tracking-wide text-muted">{title}</figcaption>
      <div className="flex gap-1 overflow-x-auto pb-1" role="img" aria-label={`${title} heatmap`}>
        {weeks.map((week, weekIndex) => (
          <div key={toDateKey(week[0]?.date ?? `${weekIndex}`)} className="flex flex-col gap-1">
            {week.map((cell) => (
              <span
                key={cell.date}
                title={`${cell.date}: ${cell.count} ${cell.count === 1 ? 'entry' : 'entries'}`}
                className={`h-2.5 w-2.5 rounded-[2px] ${LEVEL_CLASSES[Math.min(cell.level, LEVEL_CLASSES.length - 1)]}`}
              />
            ))}
          </div>
        ))}
      </div>
    </figure>
  );
}
