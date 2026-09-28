import { Clock, Lock, MapPin } from '@phosphor-icons/react';
import { EntryTags } from '../EntryTags';
import { formatWordCount } from '@/lib';
import type { Entry } from '@/types';

export interface EntryCardFooterProps {
  entry: Entry;
  maxTags?: number;
  onTagClick?: (tag: string) => void;
}

/** Tags plus the word count, reading time and privacy markers of a card. */
export function EntryCardFooter({ entry, maxTags = 3, onTagClick }: EntryCardFooterProps) {
  return (
    <footer className="flex flex-col gap-2 border-t border-primary-200/60 pt-3 dark:border-primary-700/60">
      <EntryTags tags={entry.tags} max={maxTags} onTagClick={onTagClick} />
      <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-primary-400 dark:text-primary-300">
        <span className="inline-flex items-center gap-1">
          <Clock size={14} aria-hidden="true" />
          {formatWordCount(entry.wordCount)}
        </span>
        <span>{`${entry.readingTime} min read`}</span>
        {entry.location ? (
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} aria-hidden="true" />
            {entry.location}
          </span>
        ) : null}
        {entry.isPrivate ? (
          <span className="inline-flex items-center gap-1">
            <Lock size={14} aria-hidden="true" />
            Private
          </span>
        ) : null}
      </div>
    </footer>
  );
}
