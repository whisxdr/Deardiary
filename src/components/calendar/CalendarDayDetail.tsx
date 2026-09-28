import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { EmptyDiary } from '@/components/illustrations';
import { EntryCard } from '@/components/entry';
import { formatLongDate } from '@/utils/date';
import { formatCount, formatWordCount } from '@/lib';
import { ROUTES } from '@/constants';
import type { Entry } from '@/types';

export interface CalendarDayDetailProps {
  date: Date;
  entries: Entry[];
  onToggleFavorite: (id: string) => void;
}

/** Side panel listing the entries written on the selected day. */
export function CalendarDayDetail({ date, entries, onToggleFavorite }: CalendarDayDetailProps) {
  const words = entries.reduce((total, entry) => total + entry.wordCount, 0);

  return (
    <section aria-label="Entries for the selected day" className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h3 className="font-display text-lg text-primary-800 dark:text-primary-100">{formatLongDate(date)}</h3>
        <p className="font-body text-xs text-primary-500 dark:text-primary-300">
          {`${formatCount(entries.length, 'entry', 'entries')} · ${formatWordCount(words)}`}
        </p>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="Nothing written yet"
          description="This day is still a blank page. Start writing and it will appear here."
          illustration={<EmptyDiary size={240} />}
          action={
            <Link to={ROUTES.write}>
              <Button size="sm" variant="gold">
                Write this day
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} layout="list" onToggleFavorite={onToggleFavorite} />
          ))}
        </div>
      )}
    </section>
  );
}
