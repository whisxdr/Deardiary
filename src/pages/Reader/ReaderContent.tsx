import { useEffect, useRef } from 'react';
import { sanitizeEntryHtml } from '@/lib';
import { cn } from '@/utils';

export interface ReaderContentProps {
  /** HTML produced by the editor, sanitized when the entry is stored. */
  content: string;
  className?: string;
}

/**
 * Right page of the spread: the entry body with a drop cap on the first paragraph.
 *
 * Content is sanitized here as well as on write: an imported backup is the one path
 * that can carry markup the editor never produced, and this is where it would run.
 */
export function ReaderContent({ content, className }: ReaderContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const safe = sanitizeEntryHtml(content);

  useEffect(() => {
    const first = ref.current?.querySelector('p');
    first?.classList.add('reader-drop-cap');
  }, [safe]);

  if (!safe) {
    return (
      <p className={cn('font-sub text-lg italic text-muted', className)}>
        This page is blank. Open the editor and write something worth remembering.
      </p>
    );
  }

  return (
    <div
      ref={ref}
      className={cn('entry-body font-body text-base leading-[1.8] text-primary-800 dark:text-primary-100', className)}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
