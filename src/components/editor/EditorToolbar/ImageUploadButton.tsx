import { useRef } from 'react';
import type { ReactNode } from 'react';
import { ToolbarButton } from './ToolbarButton';

export interface ImageUploadButtonProps {
  icon: ReactNode;
  onSelect: (file: File) => void;
}

/**
 * File picker disguised as a toolbar button.
 *
 * The input is cleared after every selection so picking the same file twice still fires
 * `change`; without it the second attempt is a silent no-op.
 */
export function ImageUploadButton({ icon, onSelect }: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <ToolbarButton label="Upload image" onClick={() => inputRef.current?.click()} icon={icon} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) onSelect(file);
        }}
      />
    </>
  );
}
