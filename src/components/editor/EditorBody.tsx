import { EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { cn } from '@/utils';

export interface EditorBodyProps {
  editor: Editor | null;
  className?: string;
}

/** The editable paper surface; typography comes from the editor CSS classes. */
export function EditorBody({ editor, className }: EditorBodyProps) {
  return (
    <div
      className={cn(
        'editor-surface min-h-[26rem] rounded-md border border-primary-200/70 bg-accent-cream px-5 py-6',
        'shadow-soft dark:border-primary-700 dark:bg-primary-800/70',
        className,
      )}
    >
      <EditorContent id="entry-editor" editor={editor} />
    </div>
  );
}
