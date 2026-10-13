import { useMemo } from 'react';
import { toDateKey } from '@/utils/date';
import type { HeatmapCell } from '@/types';

export interface HeatmapChartProps {
  cells: HeatmapCell[];
  title?: string;
}

/**
 * Ledger heatmap levels.
 *
 * Index 0 is an empty day; 1–2 are sage at rising strength, 3 is full sage and 4 is
 * gold, so the busiest days read as the ones you would ink in by hand.
 */
const LEVEL_CLASSES = [
  'bg-primary-200/60 dark:bg-primary-600/50',
  'bg-accent-sage/40',
  'bg-accent-sage/70',
  'bg-accent-sage',
  'bg-accent-gold',
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface Week {
  key: string;
  cells: HeatmapCell[];
  /** Month index to label at the head of this column, if it changes here. */
  monthLabel: number | null;
}

/** Groups the flat cell list into weeks, noting where each month starts. */
function groupWeeks(cells: HeatmapCell[]): Week[] {
  const weeks: Week[] = [];
  let lastMonth: number | null = null;

  cells.forEach((cell, index) => {
    const weekIndex = Math.floor(index / 7);
    (weeks[weekIndex] ??= { key: `week-${weekIndex}`, cells: [], monthLabel: null });

    const date = new Date(`${cell.date}T00:00:00`);
    if (!Number.isNaN(date.getTime()) && index % 7 === 0 && date.getMonth() !== lastMonth) {
      lastMonth = date.getMonth();
      weeks[weekIndex].monthLabel = date.getMonth();
    }

    weeks[weekIndex].cells.push(cell);
  });

  return weeks;
}

/**
 * GitHub-style contribution grid, ruled like the rest of the ledger.
 *
 * The grid and its month ruler share a single horizontal scroll container so they
 * pan together on narrow screens and the page itself never widens. The active-day
 * count and the Less→More legend are real text, so the colours are supplementary.
 */
export function HeatmapChart({ cells, title = 'Writing activity' }: HeatmapChartProps) {
  const weeks = useMemo(() => groupWeeks(cells), [cells]);
  const activeDays = useMemo(() => cells.filter((cell) => cell.count > 0).length, [cells]);

  return (
    <figure className="flex w-full min-w-0 flex-col gap-1">
      <figcaption className="sr-only">{title}</figcaption>
      <div
        className="flex gap-1 overflow-x-auto pb-1"
        role="img"
        aria-label={`${title} heatmap: ${activeDays} active ${activeDays === 1 ? 'day' : 'days'} in the last ${weeks.length} weeks`}
      >
        <div className="flex min-w-0 flex-col">
          <div className="mb-1 flex gap-1" aria-hidden="true">
            {weeks.map((week) => (
              <span key={`label-${week.key}`} className="w-[13px] shrink-0 font-body text-[10px] text-muted">
                {week.monthLabel === null ? '' : MONTH_NAMES[week.monthLabel]}
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            {weeks.map((week) => (
              <div key={week.key} className="flex flex-col gap-1">
                {week.cells.map((cell) => (
                  <span
                    key={toDateKey(cell.date)}
                    title={`${cell.date}: ${cell.count} ${cell.count === 1 ? 'entry' : 'entries'}`}
                    className={`size-[13px] rounded-[3px] ${LEVEL_CLASSES[Math.min(cell.level, LEVEL_CLASSES.length - 1)]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 font-body text-[11px] text-muted">
        <span>Less</span>
        {LEVEL_CLASSES.map((levelClass) => (
          <span key={levelClass} aria-hidden="true" className={`size-3 rounded-[3px] ${levelClass}`} />
        ))}
        <span>More</span>
      </div>
    </figure>
  );
}
