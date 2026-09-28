/**
 * Chart palette read from CSS custom properties.
 *
 * Recharts needs concrete color strings, so the values live in `theme.css` and are
 * resolved at render time. That keeps the charts in step with the active theme.
 */
export const CHART_TOKENS = {
  grid: 'var(--chart-grid)',
  tick: 'var(--chart-tick)',
  tooltipBg: 'var(--chart-tooltip-bg)',
  tooltipBorder: 'var(--chart-tooltip-border)',
  tooltipText: 'var(--chart-tooltip-text)',
  sliceStroke: 'var(--chart-slice-stroke)',
  bar: 'var(--chart-bar)',
  line: 'var(--chart-line)',
  dot: 'var(--chart-dot)',
} as const;

/** Shared tooltip styling so every chart's hover card matches. */
export const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: `1px solid ${CHART_TOKENS.tooltipBorder}`,
  background: CHART_TOKENS.tooltipBg,
  color: CHART_TOKENS.tooltipText,
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
} as const;

/** Shared axis tick styling. */
export const TICK_STYLE = { fontSize: 11, fill: CHART_TOKENS.tick } as const;
