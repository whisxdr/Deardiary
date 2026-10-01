import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui';
import { exportEntryAsPdf } from '@/services';
import { useEntryStore } from '@/store';
import { ROUTES } from '@/constants';
import { stripHtml } from '@/utils';
import type { Entry } from '@/types';

/**
 * Copies text to the clipboard.
 *
 * `navigator.clipboard` needs a secure context and permission, and can be blocked
 * inside sandboxed frames, so fall back to a hidden textarea with `execCommand`.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }

  const area = document.createElement('textarea');
  try {
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(area);
    area.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    // Removing in a `finally` keeps a throw from leaving an invisible textarea in the
    // DOM for the life of the page, one per failed attempt.
    area.remove();
  }
}

/** Share, export and delete handlers for the reader page. */
export function useReaderActions(entry: Entry | null) {
  const navigate = useNavigate();
  const removeEntry = useEntryStore((state) => state.removeEntry);

  const share = useCallback(async () => {
    if (!entry) return;
    const text = `${entry.title}\n\n${stripHtml(entry.content)}`;
    const ok = await copyText(text.trim());
    if (ok) toast.success('Entry copied to clipboard');
    else toast.error('Could not copy this entry');
  }, [entry]);

  const exportPdf = useCallback(() => {
    if (!entry) return;
    exportEntryAsPdf(entry).catch(() => toast.error('PDF export failed'));
  }, [entry]);

  /**
   * Deletes the open entry and leaves the reader.
   *
   * Reports the failure instead of assuming success: a refused write used to toast
   * "Entry deleted" and navigate away, and the entry came back on the next load.
   */
  const remove = useCallback((): boolean => {
    if (!entry) return false;
    if (!removeEntry(entry.id)) {
      toast.error('That entry could not be deleted. Storage may be full.');
      return false;
    }
    toast.success('Entry deleted');
    navigate(ROUTES.dashboard);
    return true;
  }, [entry, navigate, removeEntry]);

  return { share, exportPdf, remove } as const;
}
