import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { cn } from '@/utils';
import { EntryCardBody } from './EntryCardBody';
import { EntryCardFooter } from './EntryCardFooter';
import { EntryCardHeader } from './EntryCardHeader';
import type { Entry } from '@/types';

export interface EntryCardProps {
  entry: Entry;
  layout?: 'grid' | 'list';
  onToggleFavorite: (id: string) => void;
  onTagClick?: (tag: string) => void;
  className?: string;
}

/** Summary card for one entry, in grid or list layout. */
export const EntryCard = memo(function EntryCard({
  entry,
  layout = 'grid',
  onToggleFavorite,
  onTagClick,
  className,
}: EntryCardProps) {
  return (
    <article
      className={cn(
        'group flex flex-col gap-3 rounded-lg border border-primary-200/70 bg-accent-cream/95 p-4 shadow-soft',
        'transition-all duration-normal hover:-translate-y-0.5 hover:shadow-medium paper-texture',
        'dark:border-primary-700 dark:bg-primary-800/80',
        layout === 'list' && 'sm:flex-row sm:items-start sm:gap-6',
        className,
      )}
    >
      <div className={cn('flex flex-1 flex-col gap-3', layout === 'list' && 'sm:flex-row sm:gap-6')}>
        <div className="flex flex-1 flex-col gap-2">
          <EntryCardHeader entry={entry} onToggleFavorite={() => onToggleFavorite(entry.id)} />
          <Link
            to={ROUTES.reader(entry.id)}
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
          >
            <EntryCardBody title={entry.title} content={entry.content} date={entry.date} />
          </Link>
          <EntryCardFooter entry={entry} onTagClick={onTagClick} />
        </div>
      </div>
    </article>
  );
});
