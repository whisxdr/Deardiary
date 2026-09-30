import { useEditor, type Editor } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { countCharacters, countWords } from '@/lib';
import { EDITOR_ATTRIBUTES, EDITOR_EXTENSIONS } from './editorConfig';

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

interface AppliedContent {
  editor: Editor;
  entryId: string;
}

/** Builds the Tiptap instance with the diary extensions and exposes live counters. */
export function useEditorSetup({ initialContent, entryId, storedContent, onUpdate, onSubmit }: UseEditorSetupOptions) {
  const [words, setWords] = useState(0);
  const [characters, setCharacters] = useState(0);
  const appliedRef = useRef<AppliedContent | null>(null);
  const submitRef = useRef(onSubmit);

  useEffect(() => {
    submitRef.current = onSubmit;
  }, [onSubmit]);

  /** Ctrl/Cmd+Enter is handled by `handleKeyDown` below, not by a DOM listener. */
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
      setWords(countWords(html));
      setCharacters(countCharacters(html));
    },
  });

  /**
   * Loads the stored body once per editor instance. StrictMode destroys and recreates the
   * editor, so the guard tracks the instance rather than a plain boolean.
   *
   * `addToHistory: false` matters: the editor starts empty, so without it this load is the
   * first undo step and pressing Undo empties the page, which the autosave then stores.
   */
  useEffect(() => {
    if (!editor || !entryId || storedContent === undefined) return;
    const applied = appliedRef.current;
    if (applied && applied.editor === editor && applied.entryId === entryId) return;
    appliedRef.current = { editor, entryId };
    if (storedContent === editor.getHTML()) return;
    editor.chain().setContent(storedContent, false).setMeta('addToHistory', false).run();
    setWords(countWords(storedContent));
    setCharacters(countCharacters(storedContent));
  }, [editor, entryId, storedContent]);

  useEffect(() => {
    if (!editor) return;
    const html = editor.getHTML();
    setWords(countWords(html));
    setCharacters(countCharacters(html));
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

  return { editor, words, characters, insertImage } as const;
}
