import { Star } from '@phosphor-icons/react';
import { MoodBadge } from '@/components/mood';
import { formatRelativeDay } from '@/utils';
import type { Entry } from '@/types';

export interface EntryCardHeaderProps {
  entry: Entry;
  onToggleFavorite: () => void;
}

/** Date, mood stamp and favorite toggle shown at the top of a card. */
export function EntryCardHeader({ entry, onToggleFavorite }: EntryCardHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <MoodBadge mood={entry.mood} showLabel={false} size={20} />
        <time dateTime={entry.date} className="font-mono text-xs text-muted dark:text-primary-300">
          {formatRelativeDay(entry.date)}
        </time>
      </div>
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-label={entry.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={entry.isFavorite}
        className="rounded-md p-1 text-muted transition-colors duration-fast hover:text-accent-gold"
      >
        <Star size={16} weight={entry.isFavorite ? 'fill' : 'regular'} color="#C9A961" aria-hidden="true" />
      </button>
    </header>
  );
}
