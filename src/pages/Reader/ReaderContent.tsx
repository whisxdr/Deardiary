import { useEffect, useRef } from 'react';
import { cn } from '@/utils';

export interface ReaderContentProps {
  /** Sanitized-at-write-time HTML produced by the editor. */
  content: string;
  className?: string;
}

/** Right page of the spread: the entry body with a drop cap on the first paragraph. */
export function ReaderContent({ content, className }: ReaderContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const first = ref.current?.querySelector('p');
    first?.classList.add('reader-drop-cap');
  }, [content]);

  if (!content) {
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
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
