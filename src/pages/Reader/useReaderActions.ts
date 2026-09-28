import { useCallback } from 'react';
import { toast } from '@/components/ui';
import { exportEntryAsPdf } from '@/services';
import { stripHtml } from '@/utils';
import type { Entry } from '@/types';

/** Share and export handlers for the reader page. */
export function useReaderActions(entry: Entry | null) {
  const share = useCallback(async () => {
    if (!entry) return;
    const text = `${entry.title}\n\n${stripHtml(entry.content)}`;
    try {
      await navigator.clipboard.writeText(text.trim());
      toast.success('Entry copied to clipboard');
    } catch {
      toast.error('Could not copy this entry');
    }
  }, [entry]);

  const exportPdf = useCallback(() => {
    if (!entry) return;
    exportEntryAsPdf(entry).catch(() => toast.error('PDF export failed'));
  }, [entry]);

  return { share, exportPdf } as const;
}
