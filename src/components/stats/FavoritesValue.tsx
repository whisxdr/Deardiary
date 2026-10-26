import { Star } from '@phosphor-icons/react';
import { StatNumber } from './StatNumber';

/** Starred-page count with its gold mark, as the body of ledger row 09. */
export function FavoritesValue({ count }: { count: number }) {
  return (
    <>
      <span className="font-display text-[44px] leading-none font-bold tracking-tight text-primary-800 dark:text-primary-100">
        <StatNumber value={count} />
      </span>
      <Star aria-hidden="true" size={26} weight="fill" className="text-accent-gold" />
      <span className="font-body text-sm text-primary-600 dark:text-primary-200">entries you starred</span>
    </>
  );
}
