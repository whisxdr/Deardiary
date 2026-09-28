import { cn } from '@/utils';
import type { TagCount } from '@/types';

export interface WordCloudProps {
  tags: TagCount[];
  onTagClick?: (tag: string) => void;
}

/** Sizes each tag by frequency, capped so long lists stay readable. */
function scaleFor(count: number, max: number): string {
  const ratio = max <= 0 ? 0 : count / max;
  if (ratio > 0.8) return 'text-2xl';
  if (ratio > 0.55) return 'text-xl';
  if (ratio > 0.3) return 'text-base';
  return 'text-sm';
}

/** Tag cloud where larger words mean more entries. */
export function WordCloud({ tags, onTagClick }: WordCloudProps) {
  if (tags.length === 0) {
    return <p className="font-body text-sm text-muted">No tags yet. Tag a few entries to see them here.</p>;
  }

  const max = Math.max(...tags.map((item) => item.count));

  return (
    <ul className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
      {tags.map((item) => (
        <li key={item.tag}>
          <button
            type="button"
            onClick={onTagClick ? () => onTagClick(item.tag) : undefined}
            title={`${item.count} ${item.count === 1 ? 'entry' : 'entries'}`}
            className={cn(
              'font-display text-primary-600 transition-colors duration-fast hover:text-accent-gold dark:text-primary-200',
              scaleFor(item.count, max),
            )}
          >
            #{item.tag}
          </button>
        </li>
      ))}
    </ul>
  );
}
