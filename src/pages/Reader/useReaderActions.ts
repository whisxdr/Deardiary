import { useCallback } from 'react';
import { toast } from '@/components/ui';
import { exportEntryAsPdf } from '@/services';
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

/** Share and export handlers for the reader page. */
export function useReaderActions(entry: Entry | null) {
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

  return { share, exportPdf } as const;
}
