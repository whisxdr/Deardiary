import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { EmptyState } from '@/components/common';
import { EmptyStats } from '@/components/illustrations';
import { Button } from '@/components/ui';
import { ROUTES } from '@/constants';
import { computeStats } from '@/services';
import { useEntries } from '@/hooks';
import { StatsGrid } from './StatsGrid';

/** Statistics page: totals, streaks, charts and tag cloud. */
export default function Stats() {
  const navigate = useNavigate();
  const { entries } = useEntries();
  const stats = useMemo(() => computeStats(entries), [entries]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-5">
        <header className="flex flex-col gap-1">
          <h1 className="font-display text-2xl text-primary-800 dark:text-primary-100 sm:text-3xl">Your writing habits</h1>
          <p className="font-body text-sm text-primary-500 dark:text-primary-300">
            Everything here is calculated from entries stored in this browser.
          </p>
        </header>

        {entries.length === 0 ? (
          <EmptyState
            title="No numbers to show yet"
            description="Statistics appear once you have written a few entries."
            illustration={<EmptyStats size={320} />}
            action={
              <Button variant="gold" onClick={() => navigate(ROUTES.write)}>
                Write an entry
              </Button>
            }
          />
        ) : (
          <StatsGrid stats={stats} onTagClick={(tag) => navigate(`${ROUTES.dashboard}?tag=${tag}`)} />
        )}
      </div>
    </AppLayout>
  );
}
