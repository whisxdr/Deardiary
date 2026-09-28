import { motion } from 'framer-motion';
import { MoodIcon } from './MoodIcon';
import { MOOD_STAMP_INK } from '@/constants';
import { moodColor, moodLabel } from '@/utils';
import type { Mood } from '@/types';

export interface MoodOptionProps {
  mood: Mood;
  selected: boolean;
  onSelect: (mood: Mood) => void;
}

/** One ink-stamp tile in the mood grid, with spring hover and gold glow when active. */
export function MoodOption({ mood, selected, onSelect }: MoodOptionProps) {
  const color = selected ? moodColor(mood) : MOOD_STAMP_INK;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onSelect(mood)}
      aria-pressed={selected}
      aria-label={moodLabel(mood)}
      title={moodLabel(mood)}
      style={{ color, filter: selected ? `drop-shadow(0 0 8px ${moodColor(mood)}66)` : undefined }}
      className={
        'flex aspect-square flex-col items-center justify-center gap-1 rounded-md border transition-colors duration-fast ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold ' +
        (selected
          ? 'border-accent-gold bg-accent-gold/20'
          : 'border-primary-200 bg-primary-50/70 hover:border-accent-gold/60 dark:border-primary-700 dark:bg-primary-800/60')
      }
    >
      <MoodIcon mood={mood} size={32} color={color} />
      <span className="font-body text-[10px] text-primary-500 dark:text-primary-300">{moodLabel(mood)}</span>
    </motion.button>
  );
}
