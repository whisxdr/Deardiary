import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_TOKENS, TICK_STYLE, TOOLTIP_STYLE } from './chartTheme';
import { formatCount } from '@/lib';
import type { HourBucket } from '@/types';

export interface ActivityBarChartProps {
  data: HourBucket[];
}

/** Index of the busiest hour, used for the gold peak bar and its direct label. */
function peakIndex(data: HourBucket[]): number {
  return data.reduce((best, bucket, index) => (bucket.entries > data[best].entries ? index : best), 0);
}

/**
 * Entries by hour of day, thinned to every third label for readability.
 *
 * The peak hour is filled in gold rather than the standard bar colour and is
 * stated as text below the chart, so the answer ("when do I write?") is never
 * locked behind a hover.
 */
export function ActivityBarChart({ data }: ActivityBarChartProps) {
  const peak = useMemo(() => (data.length === 0 ? -1 : peakIndex(data)), [data]);

  if (peak < 0) {
    return <p className="font-body text-sm text-muted">No hourly activity yet.</p>;
  }

  const peakBucket = data[peak];

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 14, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={CHART_TOKENS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" interval={2} tick={{ ...TICK_STYLE, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => [formatCount(value, 'entry', 'entries'), 'Written']}
          />
          <Bar dataKey="entries" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((bucket, index) => (
              <Cell
                key={bucket.hour}
                fill={index === peak ? 'var(--accent-gold)' : CHART_TOKENS.bar}
                fillOpacity={index === peak ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="font-mono text-xs text-accent-gold-deep dark:text-accent-gold">
        {`${peakBucket.label} · ${formatCount(peakBucket.entries, 'entry', 'entries')} · your peak`}
      </p>
    </div>
  );
}
