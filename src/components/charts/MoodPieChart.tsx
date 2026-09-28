import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_TOKENS, TOOLTIP_STYLE } from './chartTheme';
import { formatCount } from '@/lib';
import type { MoodCount } from '@/types';

export interface MoodPieChartProps {
  data: MoodCount[];
}

/** Mood split rendered as a donut chart. */
export function MoodPieChart({ data }: MoodPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          innerRadius={52}
          outerRadius={82}
          paddingAngle={2}
          stroke={CHART_TOKENS.sliceStroke}
          isAnimationActive={false}
        >
          {data.map((item) => (
            <Cell key={item.mood} fill={item.color} />
          ))}
        </Pie>
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(value: string) => (
            <span style={{ fontSize: 11, color: CHART_TOKENS.tick }}>{value}</span>
          )}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number, name: string) => [formatCount(value, 'entry', 'entries'), name]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
