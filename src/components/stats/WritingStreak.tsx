import { TrendUp } from '@phosphor-icons/react';
import { StatNumber } from './StatNumber';

export interface WritingStreakProps {
  current: number;
  longest: number;
}

/** Current and longest writing streak. */
export function WritingStreak({ current, longest }: WritingStreakProps) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <span aria-hidden="true" className="text-warning">
        <FlameGlyph />
      </span>
      <div className="flex flex-col">
        <span className="font-display text-3xl text-primary-800 dark:text-primary-100">
          <StatNumber value={current} />
        </span>
        <span className="font-body text-xs text-muted dark:text-primary-300">
          {current === 1 ? 'day in a row' : 'days in a row'}
        </span>
      </div>
      <div className="ml-auto text-right">
        <span className="flex items-center justify-end gap-1 font-mono text-lg text-primary-600 dark:text-primary-200">
          <TrendUp size={16} weight="bold" aria-hidden="true" />
          {longest}
        </span>
        <span className="font-body text-[11px] text-muted">longest streak</span>
      </div>
    </div>
  );
}

/** Flame glyph for the streak, drawn inline so it can carry the warning color. */
function FlameGlyph() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21a6 6 0 0 0 6-6c0-3.6-3-6.6-6-12.5C9 8.4 6 11.4 6 15a6 6 0 0 0 6 6z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M12 21a2.4 2.4 0 0 0 2.4-2.4c0-1.6-1.2-2.9-2.4-4.7-1.2 1.8-2.4 3.1-2.4 4.7A2.4 2.4 0 0 0 12 21z"
        fill="#F5F0E6"
      />
    </svg>
  );
}
