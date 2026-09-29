import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';
import { EDITOR_PLACEHOLDER } from '@/constants';
import { countCharacters, countWords } from '@/lib';

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: EDITOR_PLACEHOLDER }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        'aria-label': 'Entry body',
        class: 'focus:outline-none min-h-[22rem]',
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      onUpdate(html);
      setWords(countWords(html));
      setCharacters(countCharacters(html));
    },
  });

  /** Ctrl/Cmd+Enter publishes; Shift+Enter keeps inserting a hard break. */
  useEffect(() => {
    if (!editor) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        event.preventDefault();
        submitRef.current?.();
      }
    };
    const dom = editor.view.dom;
    dom.addEventListener('keydown', onKeyDown);
    return () => dom.removeEventListener('keydown', onKeyDown);
  }, [editor]);

  /**
   * Loads the stored body once per editor instance. StrictMode destroys and recreates
   * the editor, so the guard tracks the instance rather than a plain boolean.
   *
   * `addToHistory: false` matters: the editor starts empty, so without it this load is
   * the first undo step and pressing Undo empties the page, which the autosave then
   * stores. Loading a page is not an edit and must not be undoable.
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

  /** Inserts an image by URL, the simplest path that needs no upload backend. */
  const insertImage = () => {
    if (!editor) return;
    const url = window.prompt('Image URL');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return { editor, words, characters, insertImage } as const;
}
