import { BookOpen, PencilSimple } from '@phosphor-icons/react';
// Imported from its own module rather than the `@/components/ui` barrel, which also
// exports Modal and so pulls Framer Motion onto the landing page's critical path.
import { Button } from '@/components/ui/Button';

export interface CoverActionsProps {
  hasDraft: boolean;
  onOpen: () => void;
  onContinue: () => void;
  isOpening: boolean;
}

/** Primary and secondary cover buttons. */
export function CoverActions({ hasDraft, onOpen, onContinue, isOpening }: CoverActionsProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        size="lg"
        variant="gold"
        onClick={onOpen}
        disabled={isOpening}
        className="min-w-56 shadow-hard"
        aria-describedby="open-book-hint"
      >
        <BookOpen size={20} weight="regular" aria-hidden="true" />
        Open the Book
      </Button>
      {hasDraft ? (
        <Button variant="outline" onClick={onContinue} className="min-w-56 border-accent-gold/60 text-primary-100">
          <PencilSimple size={20} weight="regular" aria-hidden="true" />
          Continue Writing
        </Button>
      ) : null}
      <p id="open-book-hint" className="font-body text-[11px] text-primary-200/70">
        Your entries are stored privately in this browser.
      </p>
    </div>
  );
}
