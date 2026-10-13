import { Children, cloneElement, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '@/utils';
import type { LedgerRowProps } from './LedgerRow';

export interface LedgerSheetProps {
  /** Rows in ledger order. Each should be a `LedgerRow` carrying a `key`. */
  children: ReactNode;
  className?: string;
}

/** A `LedgerRow` element reduced to just its margin note. */
function MarginNote({ note }: { note: ReactNode }) {
  // Inter, not Caveat: this note repeats down the sheet and a handwriting face is slow to read.
  return (
    <div className="flex min-h-[68px] items-start px-2.5 py-3.5">
      <p className="font-body text-[15px] leading-relaxed font-medium text-primary-600 italic dark:text-primary-200">{note}</p>
    </div>
  );
}

/**
 * The ruled ledger page that holds every statistic.
 *
 * Each child `LedgerRow` is split across two synchronized columns: its handwritten
 * note goes into the fixed left margin, and the row itself into the body column.
 * The two columns are separate flex stacks in the same CSS grid, so a row and its
 * note stay on the same horizontal band as long as the row heights match — which
 * `min-h-[68px]` guarantees.
 *
 * The decoration is CSS-only, so it adds no DOM and cannot affect layout:
 *   - `::before` is the soft red margin rule, pinned to the fixed margin column.
 *   - `::after`  is the faint horizontal ruled line behind each row.
 *
 * Below `lg` the margin column is dropped entirely and every note moves above its
 * own row instead (the `lg:hidden` copy inside `LedgerRow`).
 */
export function LedgerSheet({ children, className }: LedgerSheetProps) {
  const rows = Children.toArray(children).filter(isValidElement) as ReactElement<LedgerRowProps>[];

  return (
    <section
      aria-label="Diary statistics ledger"
      className={cn(
        'ledger-sheet relative overflow-hidden rounded-lg border border-primary-200 bg-accent-cream shadow-soft',
        'dark:border-primary-600 dark:bg-primary-800',
        className,
      )}
    >
      <div className="ledger-grid relative grid lg:grid-cols-[132px_1fr]">
        <div className="ledger-margin hidden flex-col lg:flex" aria-hidden="true">
          {rows.map((row) => {
            const key = String(row.key ?? row.props.number);
            const { marginNote } = row.props;
            return marginNote ? (
              <MarginNote key={`note-${key}`} note={marginNote} />
            ) : (
              <div key={`note-${key}`} className="min-h-[68px]" />
            );
          })}
        </div>
        <div className="ledger-body min-w-0 px-5 py-1 lg:px-7 lg:py-2.5">
          <div className="flex flex-col">
            {rows.map((row) => {
              const key = String(row.key ?? row.props.number);
              return cloneElement(row, { key: `row-${key}`, id: key });
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
