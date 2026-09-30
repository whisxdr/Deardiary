import { Button } from '@/components/ui';
import { EmptyState } from '@/components/common';

/**
 * Shown for `/write/:id` when the entry is not in the book.
 *
 * Without this the composer rendered an empty form and reported saves it could not
 * make: the id it would patch does not exist, so every keystroke was discarded while
 * the sidebar said "Saved".
 */
export function WriteMissing({ onBack }: { onBack: () => void }) {
  return (
    <EmptyState
      title="That page is missing"
      description="The entry you asked for is not in this book. It may have been deleted on another device."
      action={
        <Button variant="gold" onClick={onBack}>
          Back to entries
        </Button>
      }
    />
  );
}
