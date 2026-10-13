import { MoodIcon } from '@/components/mood';
import { formatPercent } from '@/lib';
import type { MoodCount } from '@/types';

export interface MoodStampProps {
  /** The top mood with its label, colour and share of all entries. */
  mood: MoodCount;
  className?: string;
}

/**
 * The top mood as an ink stamp pressed into the ledger page.
 *
 * A double hairline ring, rotated a few degrees, in the diary's stamp ink — the
 * same ink `theme.css` already flips for night mode, so it stays legible on dark
 * paper. The mood name and percentage are real text, so colour is never the only
 * channel; the whole stamp carries an equivalent `aria-label`.
 */
export function MoodStamp({ mood, className }: MoodStampProps) {
  return (
    <span
      role="img"
      aria-label={`Top mood: ${mood.label}, ${formatPercent(mood.percentage)} of all entries`}
      className={`inline-flex size-[76px] shrink-0 -rotate-[7deg] flex-col items-center justify-center gap-0.5 rounded-full border-[3px] border-double text-accent-ink dark:text-[#D9CBB0] ${className ?? ''}`}
    >
      <span aria-hidden="true" className="font-body text-[10px] font-semibold tracking-[0.6px] uppercase opacity-90">
        Stamp
      </span>
      <MoodIcon mood={mood.mood} size={20} color="currentColor" />
      <span className="font-display text-[15px] leading-none font-bold">{mood.label}</span>
      <span className="font-mono text-[13px] leading-none font-bold">{formatPercent(mood.percentage)}</span>
    </span>
  );
}
