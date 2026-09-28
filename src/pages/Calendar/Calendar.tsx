import { addMonths, subMonths } from 'date-fns';
import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout';
import { CalendarDayDetail, CalendarGrid, CalendarHeader } from '@/components/calendar';
import { EmptyState } from '@/components/common';
import { EmptyCalendar } from '@/components/illustrations';
import { useEntries } from '@/hooks';
import { useEntryStore } from '@/store';
import { toDateKey } from '@/utils/date';
import { Button } from '@/components/ui';
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

  return (
    <AppLayout>
      <div className="flex flex-col gap-5">
        <h1 className="sr-only">Calendar of entries</h1>
        <CalendarHeader
          month={month}
          onPrevious={() => setMonth((current) => subMonths(current, 1))}
          onNext={() => setMonth((current) => addMonths(current, 1))}
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
              <Link to={ROUTES.write}>
                <Button variant="gold">Write an entry</Button>
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
