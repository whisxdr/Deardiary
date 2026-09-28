import { MoodIcon } from './MoodIcon';
import { moodColor, moodLabel } from '@/utils';
import type { Mood } from '@/types';

export interface MoodBadgeProps {
  mood: Mood;
  showLabel?: boolean;
  size?: number;
  className?: string;
}

/** Small mood mark used on entry cards and metadata rows. */
export function MoodBadge({ mood, showLabel = true, size = 16, className }: MoodBadgeProps) {
  const color = moodColor(mood);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-body text-xs font-medium ${className ?? ''}`}
      style={{ color }}
      title={moodLabel(mood)}
    >
      <MoodIcon mood={mood} size={size} color={color} />
      {showLabel ? moodLabel(mood) : <span className="sr-only">{moodLabel(mood)}</span>}
    </span>
  );
}
