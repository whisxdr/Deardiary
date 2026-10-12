import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { EDITOR_PLACEHOLDER } from '@/constants';

/**
 * Tiptap extensions the diary body uses.
 *
 * Held apart from the hook because the list is configuration, not behaviour: the hook
 * around it is already at its line budget, and the extension set is the part a reader
 * changes when the editor gains a feature.
 */
export const EDITOR_EXTENSIONS = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  Underline,
  Link.configure({ openOnClick: false, autolink: true }),
  // Uploaded photos are stored as `data:` URLs, which `allowBase64: false` silently drops
  // on parse — the image renders, saves, and is gone at the next load.
  Image.configure({ inline: false, allowBase64: true }),
  Placeholder.configure({ placeholder: EDITOR_PLACEHOLDER }),
];

/** Attributes on the editable surface, including its accessible name. */
export const EDITOR_ATTRIBUTES = {
  'aria-label': 'Entry body',
  class: 'focus:outline-none min-h-[22rem]',
} as const;
