import type { Editor } from '@tiptap/react';
import { BlockButtons } from './BlockButtons';
import { MarkButtons } from './MarkButtons';

export interface EditorToolbarProps {
  editor: Editor | null;
  onInsertImage: () => void;
}

/** Sticky formatting toolbar driven by the Tiptap editor instance. */
export function EditorToolbar({ editor, onInsertImage }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      aria-controls="entry-editor"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-md border border-primary-200/70 bg-accent-cream/95 px-2 py-1.5 backdrop-blur shadow-soft dark:border-primary-700 dark:bg-primary-800/90"
    >
      <MarkButtons editor={editor} />
      <BlockButtons editor={editor} onInsertImage={onInsertImage} />
    </div>
  );
}
