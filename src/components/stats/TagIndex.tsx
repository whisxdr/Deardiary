import type { TagCount } from '@/types';

export interface TagIndexProps {
  tags: TagCount[];
  onTagClick?: (tag: string) => void;
}

/**
 * Popular tags as an ink index.
 *
 * Chips rather than a word cloud: each tag is a real button with its count printed
 * beside it, so the frequency the old cloud hid behind a `title` tooltip is now
 * visible text and the affordance to filter is obvious.
 */
export function TagIndex({ tags, onTagClick }: TagIndexProps) {
  if (tags.length === 0) {
    return <p className="font-body text-sm text-muted">No tags yet. Tag a few entries to see them here.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((item) => (
        <li key={item.tag}>
          <button
            type="button"
            onClick={onTagClick ? () => onTagClick(item.tag) : undefined}
            title={`${item.count} ${item.count === 1 ? 'entry' : 'entries'}`}
            className="flex min-h-[44px] items-baseline gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-2 font-body text-sm text-primary-600 transition duration-fast ease-out-expo hover:-translate-y-px hover:border-accent-gold hover:bg-accent-gold/10 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent-gold dark:border-primary-600 dark:bg-primary-900 dark:text-primary-200 dark:hover:bg-accent-gold/10"
          >
            <span aria-hidden="true" className="font-body font-bold text-accent-gold-deep dark:text-accent-gold">
              #
            </span>
            {item.tag}
            <span className="font-mono text-[12px] text-primary-500 dark:text-primary-300">{item.count}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
