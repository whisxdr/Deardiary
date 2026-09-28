import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_TOKENS, TICK_STYLE, TOOLTIP_STYLE } from './chartTheme';
import type { WeeklyPoint } from '@/types';

export interface EntriesLineChartProps {
  data: WeeklyPoint[];
}

/** Entries-per-week line chart. */
export function EntriesLineChart({ data }: EntriesLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
        <CartesianGrid stroke={CHART_TOKENS.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="week" tick={TICK_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number, name: string) => [value, name === 'entries' ? 'Entries' : name]}
        />
        <Line
          type="monotone"
          dataKey="entries"
          stroke={CHART_TOKENS.line}
          strokeWidth={2}
          dot={{ r: 3, fill: CHART_TOKENS.dot }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
