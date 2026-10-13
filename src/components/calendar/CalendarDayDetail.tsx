import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { EmptyDiary } from '@/components/illustrations';
import { EntryCard } from '@/components/entry';
import { formatLongDate, toDateKey } from '@/utils';
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
          action={<WriteThisDay date={date} variant="gold" />}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} layout="list" onToggleFavorite={onToggleFavorite} />
          ))}
          {/* This link used to render only in the empty branch, so a day that already had
              an entry could not receive a second one from the calendar. */}
          <WriteThisDay date={date} variant="outline" />
        </div>
      )}
    </section>
  );
}

/**
 * Opens the composer dated to the selected day rather than today.
 *
 * The day travels in the URL, which the composer reads as an explicit start; that is what
 * keeps the stored draft from being loaded over a deliberate date choice.
 */
function WriteThisDay({ date, variant }: { date: Date; variant: 'gold' | 'outline' }) {
  return (
    <Link
      to={`${ROUTES.write}?date=${toDateKey(date)}`}
      className={`${buttonVariants({ size: 'sm', variant })} self-start`}
    >
      Write this day
    </Link>
  );
}
