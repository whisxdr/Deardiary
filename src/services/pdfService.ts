import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { sanitizeEntryHtml } from '@/lib/sanitize';
import { formatLongDate, slugify } from '@/utils';
import type { Entry } from '@/types';

const PAGE_WIDTH_PX = 794;
const PAGE_BACKGROUND = '#F5F0E6';
const PAGE_INK = '#2A1A14';

/**
 * Off-screen clone of the entry, laid out at A4 proportions for capture.
 *
 * The clone is attached to the document, so its markup is live while html2canvas
 * rasterises it: an `onerror` handler in a body or title taken from an imported backup
 * would run here. Sanitize the body and escape the title, which is text and never
 * markup.
 */
function buildPrintPage(entry: Entry): HTMLElement {
  const page = document.createElement('article');
  page.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${PAGE_WIDTH_PX}px`,
    'padding:64px',
    `background:${PAGE_BACKGROUND}`,
    `color:${PAGE_INK}`,
    'font-family:Georgia, serif',
    'line-height:1.7',
  ].join(';');

  const heading = document.createElement('h1');
  heading.style.cssText = 'font-size:34px;margin:0 0 8px';
  // textContent, not innerHTML: a title is plain text even when it contains markup.
  heading.textContent = entry.title || 'Untitled entry';

  const dated = document.createElement('p');
  dated.style.cssText = 'color:#7D5A3C;margin:0 0 24px';
  dated.textContent = formatLongDate(entry.date);

  const body = document.createElement('div');
  body.style.cssText = 'font-size:15px';
  body.innerHTML = sanitizeEntryHtml(entry.content);

  page.append(heading, dated, body);
  return page;
}

/**
 * Renders the entry to a canvas and writes it into the PDF.
 *
 * `addImage` does not paginate: a tall entry drawn as one image is silently clipped at
 * the page box. The capture is therefore cut into page-height slices, each drawn into an
 * offscreen canvas and placed on its own page.
 */
export async function exportEntryAsPdf(entry: Entry): Promise<void> {
  const page = buildPrintPage(entry);
  document.body.appendChild(page);

  try {
    const canvas = await html2canvas(page, { scale: 2, backgroundColor: PAGE_BACKGROUND });
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    // How many source pixels make up one printed page at this capture width.
    const sliceHeight = Math.max(1, Math.floor((height * canvas.width) / width));

    for (let offset = 0; offset < canvas.height; offset += sliceHeight) {
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = Math.min(sliceHeight, canvas.height - offset);
      const context = slice.getContext('2d');
      if (!context) throw new Error('Canvas 2D context unavailable');
      context.drawImage(canvas, 0, offset, slice.width, slice.height, 0, 0, slice.width, slice.height);
      // The document starts with one page, so only later slices add one.
      if (offset > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, width, (slice.height * width) / canvas.width);
    }

    // Windows forbids \ / : * ? " < > | in a download name. slugify drops those, but also
    // every non-Latin character, so fall back to the raw title with just those characters
    // removed before giving up on it.
    const name = slugify(entry.title) || entry.title.replace(/[\\/:*?"<>|]/g, '').trim();
    pdf.save(`${name || 'entry'}.pdf`);
  } finally {
    page.remove();
  }
}
