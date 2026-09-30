import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { TIMING } from '@/constants';
import { cn } from '@/utils';

export interface HeaderSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Quiet period before the typed value is reported to `onChange`. */
  delayMs?: number;
}

/**
 * Search box that owns the text while it is being typed.
 *
 * The debounce used to live in the page, which meant every keystroke re-rendered the
 * whole dashboard — header, toolbar, grid and every mounted card — to update one input.
 * The field now keeps its own draft and reports only the settled value, so typing costs
 * one re-render of this component instead of the page.
 */
export function HeaderSearch({
  value,
  onChange,
  placeholder = 'Search your entries',
  className,
  delayMs = TIMING.searchDebounceMs,
}: HeaderSearchProps) {
  const [draft, setDraft] = useState(value);
  /**
   * Last value this field reported upwards.
   *
   * It separates the two writers: a change from outside (the URL, "clear filters") must
   * fill the box, while the echo of our own report must not overwrite what has been
   * typed since it was sent.
   */
  const reported = useRef(value);
  const changeRef = useRef(onChange);

  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (value === reported.current) return;
    reported.current = value;
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === reported.current) return;
    const timer = window.setTimeout(() => {
      reported.current = draft;
      changeRef.current(draft);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [draft, delayMs]);

  /** Clearing is immediate: a box emptied by its own button should not wait a beat. */
  const clear = () => {
    setDraft('');
    reported.current = '';
    changeRef.current('');
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      <MagnifyingGlass size={16} aria-hidden="true" className="absolute left-3 text-primary-300" />
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        aria-label="Search entries"
        className={cn(
          'h-9 w-full rounded-full border border-primary-600/70 bg-primary-800/70 pl-9 pr-8 font-body text-sm',
          'text-primary-50 placeholder:text-primary-300 focus:border-accent-gold focus:outline-none',
          'focus:ring-2 focus:ring-accent-gold/40',
        )}
      />
      {draft ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-3 text-primary-300 hover:text-accent-cream"
        >
          <X size={14} weight="bold" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
