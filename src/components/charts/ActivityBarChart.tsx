import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_TOKENS, TICK_STYLE, TOOLTIP_STYLE } from './chartTheme';
import type { HourBucket } from '@/types';

export interface ActivityBarChartProps {
  data: HourBucket[];
}

/** Entries by hour of day, thinned to every third label for readability. */
export function ActivityBarChart({ data }: ActivityBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid stroke={CHART_TOKENS.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="label"
          interval={2}
          tick={{ ...TICK_STYLE, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number) => [`${value} entries`, 'Written']}
        />
        <Bar dataKey="entries" fill={CHART_TOKENS.bar} radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
