import { PencilSimpleLine } from '@phosphor-icons/react';
import { Tooltip } from '@/components/ui';

export interface FABProps {
  onClick: () => void;
  label?: string;
}

/** Floating action button that starts a new entry. */
export function FAB({ onClick, label = 'Write a new entry' }: FABProps) {
  return (
    <Tooltip label={label} className="fixed bottom-6 right-6 z-30">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-gold text-primary-900 shadow-hard transition-transform duration-normal hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2"
      >
        <PencilSimpleLine size={24} weight="regular" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
