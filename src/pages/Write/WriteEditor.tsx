import { EditorToolbar } from '@/components/editor';
import { EditorBody } from '@/components/editor';
import { EditorCounter } from '@/components/editor';
import type { Editor } from '@tiptap/react';

export interface WriteEditorProps {
  editor: Editor | null;
  words: number;
  characters: number;
  title: string;
  onTitleChange: (title: string) => void;
  onInsertImage: () => void;
}

/** Editor column: title field, sticky toolbar, paper surface and counters. */
export function WriteEditor({
  editor,
  words,
  characters,
  title,
  onTitleChange,
  onInsertImage,
}: WriteEditorProps) {
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
    </section>
  );
}
