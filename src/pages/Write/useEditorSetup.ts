import { useEditor } from '@tiptap/react';
import { useEffect, useRef } from 'react';
import { EDITOR_ATTRIBUTES, EDITOR_EXTENSIONS } from './editorConfig';
import { useEditorCounts } from './useEditorCounts';
import { useStoredContent } from './useStoredContent';

export interface UseEditorSetupOptions {
  /** HTML the editor starts with; used for new entries and templates. */
  initialContent: string;
  /** Entry id being edited, or undefined while composing a new entry. */
  entryId?: string;
  /** Body of the stored entry, applied once the store has hydrated. */
  storedContent?: string;
  onUpdate: (html: string) => void;
  /** Runs on Ctrl/Cmd+Enter. Tiptap binds that combo to a hard break by default. */
  onSubmit?: () => void;
}

/** Builds the Tiptap instance with the diary extensions and exposes live counters. */
export function useEditorSetup({ initialContent, entryId, storedContent, onUpdate, onSubmit }: UseEditorSetupOptions) {
  const { words, characters, contentLength, measureNow, scheduleMeasure } = useEditorCounts();
  const submitRef = useRef(onSubmit);

  useEffect(() => {
    submitRef.current = onSubmit;
  }, [onSubmit]);

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: initialContent,
    editorProps: {
      attributes: EDITOR_ATTRIBUTES,
      /**
       * Ctrl/Cmd+Enter publishes; Shift+Enter keeps inserting a hard break.
       *
       * Returning true consumes the event before ProseMirror's own keymap runs. A DOM
       * listener cannot do this: ProseMirror registers its handler first, so by the time
       * the listener fired the hard break was already inserted.
       */
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
          submitRef.current?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      onUpdate(html);
      // Only the raw length is recorded on the keystroke path; the word/character regex
      // passes are deferred, so typing does not run a full-body scan per key.
      scheduleMeasure(html);
    },
  });

  // Applies the stored body once per editor instance and refreshes the counters at once:
  // a load is not a keystroke, so there is no reason to defer it.
  useStoredContent({ editor, entryId, storedContent, onApplied: measureNow });

  useEffect(() => {
    if (!editor) return;
    measureNow(editor.getHTML());
  }, [editor]);

  /**
   * Inserts an image by URL, the simplest path that needs no upload backend.
   *
   * Only `http(s)` is accepted. A `data:` URL would render and save, but the Image
   * extension's parse rule drops `data:` sources, so the next reload lost the image and
   * the following keystroke wrote the body back without it.
   */
  const insertImage = () => {
    if (!editor) return;
    const url = window.prompt('Image URL');
    if (url && /^https?:\/\//i.test(url)) editor.chain().focus().setImage({ src: url }).run();
  };

  return { editor, words, characters, contentLength, insertImage } as const;
}
