import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { BookFlip, BookSpread } from '@/components/book';
import { toast } from '@/components/ui';
import { EntryActions } from '@/components/entry';
import { ROUTES } from '@/constants';
import { printEntry } from '@/services';
import { useEntries, useEntry, useKeyboard } from '@/hooks';
import { useEntryStore } from '@/store';
import { ReaderContent } from './ReaderContent';
import { ReaderDeleteDialog, ReaderExportRow, ReaderMissing } from './ReaderExtras';
import { ReaderMetadata } from './ReaderMetadata';
import { ReaderNav } from './ReaderNav';
import { useReaderActions } from './useReaderActions';

/** Book-spread reader with keyboard navigation and export actions. */
export default function Reader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { entries } = useEntries();
  const entry = useEntry(id);
  const favorite = useEntryStore((state) => state.favorite);
  const removeEntry = useEntryStore((state) => state.removeEntry);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const { share, exportPdf } = useReaderActions(entry);

  const index = useMemo(() => entries.findIndex((item) => item.id === id), [entries, id]);
  const hasPrevious = index > 0;
  const hasNext = index >= 0 && index < entries.length - 1;

  const goTo = (offset: number) => {
    const target = entries[index + offset];
    if (!target) return;
    setDirection(offset < 0 ? 'backward' : 'forward');
    navigate(ROUTES.reader(target.id));
  };

  useKeyboard([
    { key: 'ArrowLeft', handler: () => goTo(-1) },
    { key: 'ArrowRight', handler: () => goTo(1) },
  ]);

  useEffect(() => {
    document.title = entry ? `${entry.title || 'Entry'} — DearDiary` : 'DearDiary';
    return () => {
      document.title = 'DearDiary — Every page is your story';
    };
  }, [entry]);

  if (!entry) {
    return (
      <AppLayout>
        <ReaderMissing onBack={() => navigate(ROUTES.dashboard)} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-4">
        <ReaderNav
          position={index + 1}
          total={entries.length}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={() => goTo(-1)}
          onNext={() => goTo(1)}
        />
        <BookFlip pageKey={entry.id} direction={direction}>
          <BookSpread
            left={<ReaderMetadata entry={entry} onTagClick={(tag) => navigate(`${ROUTES.dashboard}?tag=${tag}`)} />}
            right={<ReaderContent content={entry.content} />}
          />
        </BookFlip>
        <EntryActions
          isFavorite={entry.isFavorite}
          onEdit={() => navigate(ROUTES.writeEntry(entry.id))}
          onDelete={() => setConfirmOpen(true)}
          onShare={() => void share()}
          onExport={exportPdf}
          onPrint={printEntry}
          onToggleFavorite={() => favorite(entry.id)}
        />
        <ReaderExportRow entry={entry} />
      </div>
      <ReaderDeleteDialog
        open={confirmOpen}
        onConfirm={() => {
          removeEntry(entry.id);
          toast.success('Entry deleted');
          navigate(ROUTES.dashboard);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </AppLayout>
  );
}
