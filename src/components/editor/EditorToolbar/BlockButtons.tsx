import {
  Image as ImageIcon,
  Link as LinkIcon,
  ListBullets,
  ListNumbers,
  Minus,
  Quotes,
  TextHOne,
  TextHThree,
  TextHTwo,
} from '@phosphor-icons/react';
import type { Editor } from '@tiptap/react';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarDivider } from './ToolbarDivider';

export interface BlockButtonsProps {
  editor: Editor;
  onInsertImage: () => void;
}

/** Headings, lists, quote, rule, link and image controls. */
export function BlockButtons({ editor, onInsertImage }: BlockButtonsProps) {
  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <>
      <ToolbarButton
        label="Heading 1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        icon={<TextHOne size={16} aria-hidden="true" />}
      />
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        icon={<TextHTwo size={16} aria-hidden="true" />}
      />
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        icon={<TextHThree size={16} aria-hidden="true" />}
      />
      <ToolbarDivider />
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        icon={<ListBullets size={16} aria-hidden="true" />}
      />
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        icon={<ListNumbers size={16} aria-hidden="true" />}
      />
      <ToolbarButton
        label="Quote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        icon={<Quotes size={16} aria-hidden="true" />}
      />
      <ToolbarButton
        label="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        icon={<Minus size={16} aria-hidden="true" />}
      />
      <ToolbarDivider />
      <ToolbarButton
        label="Link"
        active={editor.isActive('link')}
        onClick={setLink}
        icon={<LinkIcon size={16} aria-hidden="true" />}
      />
      <ToolbarButton label="Image" onClick={onInsertImage} icon={<ImageIcon size={16} aria-hidden="true" />} />
    </>
  );
}
