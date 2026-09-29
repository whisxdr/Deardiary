import { AppLayout } from '@/components/layout';
import { Loading } from '@/components/illustrations';
import { ReaderMissing } from './ReaderExtras';

/** Shown while the store is still reading entries, so the reader does not flash "missing". */
export function ReaderLoading() {
  return (
    <AppLayout>
      <div className="flex justify-center py-16">
        <Loading size={200} />
      </div>
    </AppLayout>
  );
}

/** Shown when the requested id is not in the book. */
export function ReaderNotFound({ onBack }: { onBack: () => void }) {
  return (
    <AppLayout>
      <ReaderMissing onBack={onBack} />
    </AppLayout>
  );
}
