import { EditorToolbar } from '@/components/editor';
import { EditorBody } from '@/components/editor';
import { EditorCounter } from '@/components/editor';
import { LIMITS } from '@/constants';
import type { Editor } from '@tiptap/react';

export interface WriteEditorProps {
  editor: Editor | null;
  words: number;
  characters: number;
  /** Raw body length; the write path clamps it at `LIMITS.contentMaxLength`. */
  contentLength: number;
  title: string;
  onTitleChange: (title: string) => void;
  onInsertImage: () => void;
}

/** Editor column: title field, sticky toolbar, paper surface and counters. */
export function WriteEditor({
  editor,
  words,
  characters,
  contentLength,
  title,
  onTitleChange,
  onInsertImage,
}: WriteEditorProps) {
  // Feedback starts at 90% so the limit never arrives unannounced. The write path clamps
  // silently, so without this the tail of a long entry would vanish on the next save.
  const nearLimit = contentLength >= LIMITS.contentMaxLength * 0.9;
  return (
    <section aria-label="Entry editor" className="flex flex-col gap-3">
      <h1 className="sr-only">Write an entry</h1>
      <label htmlFor="entry-title" className="sr-only">
        Entry title
      </label>
      <input
        id="entry-title"
        value={title}
        onChange={(event) => onTitleChange(event.target.value)}
        placeholder="Give this page a title"
        maxLength={120}
        className="w-full border-0 border-b border-primary-200 bg-transparent pb-2 font-display text-2xl text-primary-800 placeholder:text-muted focus:border-accent-gold focus:outline-none dark:border-primary-700 dark:text-primary-100"
      />
      <EditorToolbar editor={editor} onInsertImage={onInsertImage} />
      <EditorBody editor={editor} />
      <EditorCounter words={words} characters={characters} />
      {nearLimit ? (
        <p aria-live="polite" className="font-body text-xs text-warning">
          {contentLength > LIMITS.contentMaxLength
            ? 'Over the character limit — the end of this entry will be cut when it is saved.'
            : `${contentLength.toLocaleString('en-US')} of ${LIMITS.contentMaxLength.toLocaleString('en-US')} characters used.`}
        </p>
      ) : null}
    </section>
  );
}
