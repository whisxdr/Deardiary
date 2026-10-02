import { MoodIcon } from './MoodIcon';
import { moodColor, moodLabel } from '@/utils';
import type { Mood } from '@/types';

export interface MoodBadgeProps {
  mood: Mood;
  showLabel?: boolean;
  size?: number;
  className?: string;
}

/**
 * Small mood mark used on entry cards and metadata rows.
 *
 * The mood colour is the accent: it fills the icon, while the label uses the themed body
 * text. Painting the 12px label in the mood colour failed WCAG AA for 10 of the 12 moods
 * (happy 1.63:1, excited 1.44:1 on cream); the themed text reads at 12.17:1 on cream and
 * 10.41:1 on night paper.
 */
export function MoodBadge({ mood, showLabel = true, size = 16, className }: MoodBadgeProps) {
  const color = moodColor(mood);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-body text-xs font-medium text-primary-700 dark:text-primary-200 ${className ?? ''}`}
      title={moodLabel(mood)}
    >
      <MoodIcon mood={mood} size={size} color={color} />
      {showLabel ? moodLabel(mood) : <span className="sr-only">{moodLabel(mood)}</span>}
    </span>
  );
}
