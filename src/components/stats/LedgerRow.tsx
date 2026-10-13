import type { ReactNode } from 'react';

export interface LedgerRowProps {
  /**
   * Stable identity for this row.
   *
   * `LedgerSheet` clones each row into a margin note and a body line, so it needs a
   * key of its own to attach to the clones. The sheet supplies it from the element's
   * `key`, which keeps callers from having to repeat themselves.
   */
  id?: string;
  /** Entry number printed in the margin, e.g. '01'. */
  number: string;
  /** Uppercase label in the label column, e.g. 'Total entries'. */
  label: string;
  /** Optional second line under the label, e.g. a headline value or hint. */
  sublabel?: ReactNode;
  /** Handwritten note kept in the left margin beside this row. */
  marginNote?: ReactNode;
  /** The value, chart or chips that belong in the body column. */
  children: ReactNode;
  /** Extra classes for the body column, e.g. stretch alignment for charts. */
  bodyClassName?: string;
}

/**
 * One line of the statistics ledger.
 *
 * The row is the unit that replaces `StatCard`: a numbered label column and a body
 * column, separated by a ruled hairline. The sheet draws the margin rule and the
 * horizontal ruled lines; the row only supplies its own bottom hairline.
 */
export function LedgerRow({ id, number, label, sublabel, marginNote, children, bodyClassName }: LedgerRowProps) {
  return (
    <div className="ledger-row grid items-center gap-x-lg gap-y-xs py-3.5 min-h-[68px] border-b border-primary-200/50 last:border-b-0 lg:grid-cols-[200px_1fr]">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2.5">
          <span aria-hidden="true" className="font-mono text-[13px] text-primary-600 dark:text-primary-200">
            {number}
          </span>
          <h3 className="font-body text-[13px] font-semibold tracking-wide text-primary-600 uppercase dark:text-primary-200">{label}</h3>
        </div>
        {sublabel ? <div className="pl-7">{sublabel}</div> : null}
      </div>
      <div className={`flex min-w-0 flex-wrap items-center gap-md ${bodyClassName ?? ''}`}>{children}</div>
      {/*
        The margin note has two homes: beside the row on wide screens (rendered by
        `LedgerSheet` into the margin column) and above the row on narrow ones, where
        the margin column collapses. Only the narrow version lives here, so it is
        hidden at `lg` and up to avoid printing the note twice.
      */}
      {marginNote ? (
        <p
          id={id ? `${id}-note` : undefined}
          className="ledger-margin-note -order-1 font-body text-[15px] leading-relaxed font-medium text-primary-600 italic lg:hidden dark:text-primary-200"
        >
          {marginNote}
        </p>
      ) : null}
    </div>
  );
}
