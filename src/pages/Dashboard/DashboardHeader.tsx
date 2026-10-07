import { Link } from 'react-router-dom';
import { Plus } from '@phosphor-icons/react';
import { buttonVariants } from '@/components/ui';
import { ROUTES } from '@/constants';
import { formatCount } from '@/lib';
import { useSettingsStore } from '@/store';

export interface DashboardHeaderProps {
  total: number;
  visible: number;
  displayName: string;
}

/** Greeting, bio, entry counts and the primary write action. */
export function DashboardHeader({ total, visible, displayName }: DashboardHeaderProps) {
  // Read here rather than through a prop: the dashboard page is composed elsewhere,
  // and the bio has no other reader in the app.
  const bio = useSettingsStore((state) => state.settings.bio);

  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl text-primary-800 dark:text-primary-100 sm:text-3xl">
          {`Welcome back, ${displayName}`}
        </h1>
        {bio.trim() ? (
          <p className="font-sub text-base italic text-muted dark:text-primary-300">{bio}</p>
        ) : null}
        <p className="font-body text-sm text-primary-500 dark:text-primary-300">
          {`Showing ${visible} of ${formatCount(total, 'entry', 'entries')} in your book.`}
        </p>
      </div>
      <Link to={ROUTES.write} className={buttonVariants({ variant: 'gold' })}>
        <Plus size={16} weight="regular" aria-hidden="true" />
        New entry
      </Link>
    </header>
  );
}
