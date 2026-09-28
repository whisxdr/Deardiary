import { entryPreview, entryTitle } from '@/lib';

export interface EntryCardBodyProps {
  title: string;
  content: string;
  date: string;
  previewLength?: number;
}

/** Title and preview text of a card. */
export function EntryCardBody({ title, content, date, previewLength = 150 }: EntryCardBodyProps) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-display text-lg leading-snug text-primary-800 dark:text-primary-100">
        {entryTitle(title, date)}
      </h3>
      <p className="font-body text-sm leading-relaxed text-primary-500 dark:text-primary-300">
        {entryPreview(content, previewLength)}
      </p>
    </div>
  );
}
