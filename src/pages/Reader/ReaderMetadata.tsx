import { CalendarBlank, Clock, Hash, MapPin, Star } from '@phosphor-icons/react';
import { MoodBadge } from '@/components/mood';
import { formatLongDate, formatTime } from '@/utils';
import { formatWordCount } from '@/lib';
import type { Entry } from '@/types';

export interface ReaderMetadataProps {
  entry: Entry;
  onTagClick: (tag: string) => void;
}

/** Left page of the spread: when, where, mood, tags and word stats. */
export function ReaderMetadata({ entry, onTagClick }: ReaderMetadataProps) {
  return (
    <div className="flex h-full flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl leading-tight text-primary-800 dark:text-primary-100">
          {entry.title || 'Untitled entry'}
        </h1>
        <p className="font-hand text-xl text-muted dark:text-primary-300">
          {`Feeling ${entry.mood === 'mindblown' ? 'mind-blown' : entry.mood}`}
        </p>
      </header>

      <dl className="flex flex-col gap-3 font-body text-sm">
        <div className="flex items-center gap-2">
          <CalendarBlank size={16} aria-hidden="true" className="text-muted" />
          <dt className="sr-only">Date</dt>
          <dd className="text-primary-700 dark:text-primary-200">{formatLongDate(entry.date)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} aria-hidden="true" className="text-muted" />
          <dt className="sr-only">Time</dt>
          <dd className="text-primary-700 dark:text-primary-200">{formatTime(entry.date)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <MoodBadge mood={entry.mood} size={16} />
          <dt className="sr-only">Mood</dt>
        </div>
        {entry.location ? (
          <div className="flex items-center gap-2">
            <MapPin size={16} aria-hidden="true" className="text-muted" />
            <dt className="sr-only">Location</dt>
            <dd className="text-primary-700 dark:text-primary-200">{entry.location}</dd>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Hash size={16} aria-hidden="true" className="text-muted" />
          <dt className="sr-only">Statistics</dt>
          <dd className="font-mono text-xs text-muted dark:text-primary-300">
            {`${formatWordCount(entry.wordCount)} · ${entry.readingTime} min read`}
          </dd>
        </div>
        {entry.isFavorite ? (
          <div className="flex items-center gap-2">
            <Star size={16} weight="fill" color="#C9A961" aria-hidden="true" />
            <dt className="sr-only">Favorite</dt>
            <dd className="text-primary-700 dark:text-primary-200">Saved to favorites</dd>
          </div>
        ) : null}
      </dl>

      {entry.tags.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-body text-xs uppercase tracking-wide text-muted">Tags</h2>
          <ul className="flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => onTagClick(tag)}
                  className="rounded-full border border-primary-200 bg-primary-100/70 px-3 py-1 font-body text-xs text-primary-600 transition-colors duration-fast hover:border-accent-gold dark:border-primary-700 dark:bg-primary-800/70 dark:text-primary-200"
                >
                  {`#${tag}`}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-auto font-mono text-[11px] text-muted">
        {`Last edited ${formatLongDate(entry.updatedAt)}`}
      </p>
    </div>
  );
}
