import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_TOKENS, TICK_STYLE, TOOLTIP_STYLE } from './chartTheme';
import type { WeeklyPoint } from '@/types';

export interface EntriesLineChartProps {
  data: WeeklyPoint[];
}

/** Index of the busiest week, used for the direct peak label. */
function peakIndex(data: WeeklyPoint[]): number {
  return data.reduce((best, point, index) => (point.entries > data[best].entries ? index : best), 0);
}

/**
 * Entries-per-week line chart, labelled like a ledger chart.
 *
 * The peak point carries a direct numeric label above it, so the headline value is
 * readable without hovering. The tooltip stays for exact per-week figures but is
 * never the only way to read the story.
 */
export function EntriesLineChart({ data }: EntriesLineChartProps) {
  const peak = useMemo(() => (data.length === 0 ? -1 : peakIndex(data)), [data]);
  const peakPoint = peak >= 0 ? data[peak] : undefined;

  if (peakPoint === undefined) {
    return <p className="font-body text-sm text-muted">No weekly activity yet.</p>;
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data} margin={{ top: 18, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={CHART_TOKENS.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" tick={TICK_STYLE} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number, name: string) => [value, name === 'entries' ? 'Entries' : name]}
          />
          <Line
            type="monotone"
            dataKey="entries"
            stroke={CHART_TOKENS.line}
            strokeWidth={2.4}
            dot={{ r: 3, fill: CHART_TOKENS.dot }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          {/* Direct peak label: the number itself, not a hover-only value. */}
          <Line
            dataKey="entries"
            legendType="none"
            stroke="none"
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; index?: number; key?: string }) => {
              if (props.index !== peak || props.cx === undefined || props.cy === undefined) {
                return <g key={`empty-${props.index}`} />;
              }
              return (
                <g key={`peak-${props.index}`}>
                  <circle cx={props.cx} cy={props.cy} r={5} fill={CHART_TOKENS.line} stroke={CHART_TOKENS.dot} strokeWidth={1.5} />
                  <text
                    x={props.cx}
                    y={props.cy - 10}
                    textAnchor="middle"
                    className="font-mono"
                    style={{ fontSize: 13, fontWeight: 700, fill: CHART_TOKENS.dot }}
                  >
                    {peakPoint.entries}
                  </text>
                </g>
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="font-mono text-xs text-accent-gold-deep dark:text-accent-gold">
        {`peak ${peakPoint.entries} · week of ${peakPoint.week}`}
      </p>
    </div>
  );
}
