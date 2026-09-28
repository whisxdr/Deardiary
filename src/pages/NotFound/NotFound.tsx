import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { Button } from '@/components/ui';
import { NotFound } from '@/components/illustrations';
import { ROUTES } from '@/constants';

/** Fallback page for unknown routes. */
export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-primary-50 px-4 text-center dark:bg-primary-900">
      <NotFound size={320} />
      <h1 className="font-display text-2xl text-primary-800 dark:text-primary-100">This page fell out of the book</h1>
      <p className="max-w-md font-body text-sm text-primary-500 dark:text-primary-300">
        The link you followed does not lead anywhere in this diary. Your entries are safe.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link to={ROUTES.dashboard}>
          <Button variant="gold">
            <ArrowLeft size={16} weight="regular" aria-hidden="true" />
            Back to entries
          </Button>
        </Link>
        <Link to={ROUTES.landing}>
          <Button variant="outline">Return to the cover</Button>
        </Link>
      </div>
    </main>
  );
}
