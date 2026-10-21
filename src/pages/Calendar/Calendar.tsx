import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout';
import { CalendarDayDetail, CalendarGrid, CalendarHeader } from '@/components/calendar';
import { EmptyState } from '@/components/common';
import { EmptyCalendar } from '@/components/illustrations';
import { useEntries } from '@/hooks';
import { useEntryStore } from '@/store';
import { addMonths, startOfMonth, toDateKey } from '@/utils';
import { buttonVariants } from '@/components/ui';
import { formatCount, formatWordCount } from '@/lib';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';

/** Month view of the diary with a detail panel for the selected day. */
export default function Calendar() {
  const { entries } = useEntries();
  const favorite = useEntryStore((state) => state.favorite);
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());

  const dayEntries = useMemo(() => {
    const key = toDateKey(selected);
    return entries.filter((entry) => toDateKey(entry.date) === key);
  }, [entries, selected]);

  const monthSummary = useMemo(() => {
    const inMonth = entries.filter((entry) => {
      const date = new Date(entry.date);
      return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
    });
    const days = new Set(inMonth.map((entry) => toDateKey(entry.date))).size;
    const words = inMonth.reduce((total, entry) => total + entry.wordCount, 0);
    return `${formatCount(inMonth.length, 'entry', 'entries')} on ${formatCount(days, 'day', 'days')} · ${formatWordCount(words)}`;
  }, [entries, month]);

  // Moving the month also moves the selection into it, so the detail panel never shows a
  // day that is off-screen and the new grid always has a highlighted cell.
  const goToMonth = (offset: number) => {
    const next = addMonths(month, offset);
    setMonth(next);
    setSelected(startOfMonth(next));
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-5">
        <h1 className="sr-only">Calendar of entries</h1>
        <CalendarHeader
          month={month}
          summary={monthSummary}
          onPrevious={() => goToMonth(-1)}
          onNext={() => goToMonth(1)}
          onToday={() => {
            const today = new Date();
            setMonth(today);
            setSelected(today);
          }}
        />

        {entries.length === 0 ? (
          <EmptyState
            title="No days marked yet"
            description="Once you write your first entry, its day will be highlighted here."
            illustration={<EmptyCalendar size={320} />}
            action={
              <Link to={ROUTES.write} className={buttonVariants({ variant: 'gold' })}>
                Write an entry
              </Link>
            }
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <CalendarGrid month={month} entries={entries} selectedDate={selected} onSelect={setSelected} />
            <CalendarDayDetail date={selected} entries={dayEntries} onToggleFavorite={favorite} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
