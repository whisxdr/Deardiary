import { toast } from '@/components/ui';
import { imageFileToDataUrl } from '@/lib';
import type { Editor } from '@tiptap/react';

/** Inserts an image by URL, the path that needs no upload backend. */
export function insertImageByUrl(editor: Editor): void {
  const url = window.prompt('Image URL');
  if (url && /^https?:\/\//i.test(url)) editor.chain().focus().setImage({ src: url }).run();
}

/** Crops and compresses the chosen file, then inserts it. */
export async function insertImageFromFile(editor: Editor, file: File): Promise<void> {
  const src = await imageFileToDataUrl(file);
  editor.chain().focus().setImage({ src }).run();
}

/** Reports why a file was refused instead of dropping the upload silently. */
export function reportUpload(
  insert: (editor: Editor, file: File) => Promise<void>,
  editor: Editor,
  file: File,
): void {
  insert(editor, file).catch((error: unknown) => {
    toast.error(error instanceof Error ? error.message : 'That image could not be added.');
  });
}
