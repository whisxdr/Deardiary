import { Chip } from '@/components/ui';

export interface EntryTagsProps {
  tags: string[];
  max?: number;
  onTagClick?: (tag: string) => void;
  className?: string;
}

/** Tag chips for an entry, truncated to `max` with a remainder count. */
export function EntryTags({ tags, max = 4, onTagClick, className }: EntryTagsProps) {
  if (tags.length === 0) return null;
  const visible = tags.slice(0, max);
  const hidden = tags.length - visible.length;

  return (
    <ul className={`flex flex-wrap items-center gap-1.5 ${className ?? ''}`} aria-label="Tags">
      {visible.map((tag) => (
        <li key={tag}>
          <Chip onClick={onTagClick ? () => onTagClick(tag) : undefined}>{`#${tag}`}</Chip>
        </li>
      ))}
      {hidden > 0 ? (
        <li>
          <Chip>{`+${hidden}`}</Chip>
        </li>
      ) : null}
    </ul>
  );
}
