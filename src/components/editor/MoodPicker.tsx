import { MOODS } from '@/constants';
import { MoodBadge } from '@/components/mood';
import { MoodPickerGrid } from '@/components/mood';
import { formatCount } from '@/lib';
import { moodLabel } from '@/utils';
import type { Mood } from '@/types';

export interface MoodPickerProps {
  value: Mood;
  onChange: (mood: Mood) => void;
  className?: string;
}

/** Sidebar mood section: the icon grid plus the current selection label. */
export function MoodPicker({ value, onChange, className }: MoodPickerProps) {
  return (
    <div className={className}>
      <MoodPickerGrid value={value} onChange={onChange} />
      <p className="mt-1 font-body text-xs text-muted">
        {`${formatCount(MOODS.length, 'mood')} available · selected: ${moodLabel(value)}`}
      </p>
    </div>
  );
}

export { MoodBadge };
