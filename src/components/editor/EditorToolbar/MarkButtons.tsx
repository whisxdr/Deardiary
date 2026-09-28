import {
  ArrowCounterClockwise,
  ArrowUUpLeft,
  TextB,
  TextItalic,
  TextStrikethrough,
  TextUnderline,
} from '@phosphor-icons/react';
import type { Editor } from '@tiptap/react';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarDivider } from './ToolbarDivider';

export interface MarkButtonsProps {
  editor: Editor;
}

/** Bold, italic, underline, strike and history controls. */
export function MarkButtons({ editor }: MarkButtonsProps) {
  return (
    <>
      <ToolbarButton
        label="Bold"
        shortcut="Ctrl+B"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        icon={<TextB size={16} weight="bold" aria-hidden="true" />}
      />
      <ToolbarButton
        label="Italic"
        shortcut="Ctrl+I"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        icon={<TextItalic size={16} aria-hidden="true" />}
      />
      <ToolbarButton
        label="Underline"
        shortcut="Ctrl+U"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        icon={<TextUnderline size={16} aria-hidden="true" />}
      />
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        icon={<TextStrikethrough size={16} aria-hidden="true" />}
      />
      <ToolbarDivider />
      <ToolbarButton
        label="Undo"
        shortcut="Ctrl+Z"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
        icon={<ArrowUUpLeft size={16} aria-hidden="true" />}
      />
      <ToolbarButton
        label="Redo"
        shortcut="Ctrl+Shift+Z"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
        icon={<ArrowCounterClockwise size={16} aria-hidden="true" />}
      />
    </>
  );
}
