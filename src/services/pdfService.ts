import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { sanitizeEntryHtml } from '@/lib/sanitize';
import { formatLongDate, stripHtml } from '@/utils';
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

/** Renders the entry to a canvas and writes it into a PDF page. */
export async function exportEntryAsPdf(entry: Entry): Promise<void> {
  const page = buildPrintPage(entry);
  document.body.appendChild(page);

  try {
    const canvas = await html2canvas(page, { scale: 2, backgroundColor: PAGE_BACKGROUND });
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height);
    // stripHtml for the filename: markup has no place in a download name, and `&`
    // should stay `&` rather than become an entity.
    pdf.save(`${stripHtml(entry.title) || 'entry'}.pdf`);
  } finally {
    page.remove();
  }
}
