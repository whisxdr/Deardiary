import { MOODS } from '@/constants';
import { MoodOption } from './MoodOption';
import { moodLabel } from '@/utils';
import type { Mood } from '@/types';

export interface MoodPickerGridProps {
  value: Mood;
  onChange: (mood: Mood) => void;
  className?: string;
}

/** Twelve-mood icon grid with the current selection spelled out below. */
export function MoodPickerGrid({ value, onChange, className }: MoodPickerGridProps) {
  return (
    <div className={className}>
      <div role="radiogroup" aria-label="Select mood" className="grid grid-cols-4 gap-2">
        {MOODS.map((mood) => (
          <MoodOption key={mood.id} mood={mood.id} selected={mood.id === value} onSelect={onChange} />
        ))}
      </div>
      <p className="mt-2 font-hand text-lg text-primary-500 dark:text-primary-300">
        {`Feeling ${moodLabel(value).toLowerCase()}`}
      </p>
    </div>
  );
}
