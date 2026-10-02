import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';

interface AppliedContent {
  editor: Editor;
  entryId: string;
}

export interface UseStoredContentOptions {
  editor: Editor | null;
  entryId?: string;
  storedContent?: string;
  /** Receives the applied HTML so the counters can refresh. */
  onApplied: (html: string) => void;
}

/**
 * Loads the stored body once per editor instance. StrictMode destroys and recreates the
 * editor, so the guard tracks the instance rather than a plain boolean.
 *
 * `addToHistory: false` matters: the editor starts empty, so without it this load is the
 * first undo step and pressing Undo empties the page, which the autosave then stores.
 */
export function useStoredContent({ editor, entryId, storedContent, onApplied }: UseStoredContentOptions): void {
  const appliedRef = useRef<AppliedContent | null>(null);
  const onAppliedRef = useRef(onApplied);

  useEffect(() => {
    onAppliedRef.current = onApplied;
  }, [onApplied]);

  useEffect(() => {
    if (!editor || !entryId || storedContent === undefined) return;
    const applied = appliedRef.current;
    if (applied && applied.editor === editor && applied.entryId === entryId) return;
    appliedRef.current = { editor, entryId };
    if (storedContent === editor.getHTML()) return;
    editor.chain().setContent(storedContent, false).setMeta('addToHistory', false).run();
    onAppliedRef.current(storedContent);
  }, [editor, entryId, storedContent]);
}
