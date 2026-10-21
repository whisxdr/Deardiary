import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { CHART_TOKENS, TICK_STYLE } from './chartTheme';
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
 * No tooltip: on a phone the Recharts cursor stays painted over the bars after a
 * tap and cannot be dismissed, which reads as a broken chart. The peak hour is
 * filled in gold and stated as text below, so the answer ("when do I write?")
 * never needed a hover in the first place.
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
          <XAxis dataKey="label" interval={3} tick={{ ...TICK_STYLE, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 'dataMax']} />
          <Bar dataKey="entries" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((bucket, index) => (
              <Cell
                key={bucket.hour}
                fill={index === peak ? 'rgb(var(--color-gold))' : CHART_TOKENS.bar}
                fillOpacity={index === peak ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="font-mono text-[13px] font-semibold text-accent-gold-deep dark:text-accent-gold">
        {`${peakBucket.label} · ${formatCount(peakBucket.entries, 'entry', 'entries')} · your peak`}
      </p>
    </div>
  );
}
