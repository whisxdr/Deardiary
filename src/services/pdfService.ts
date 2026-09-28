import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatLongDate } from '@/utils';
import type { Entry } from '@/types';

const PAGE_WIDTH_PX = 794;
const PAGE_BACKGROUND = '#F5F0E6';
const PAGE_INK = '#2A1A14';

/** Off-screen clone of the entry, laid out at A4 proportions for capture. */
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
  page.innerHTML = `<h1 style="font-size:34px;margin:0 0 8px">${entry.title || 'Untitled entry'}</h1>
    <p style="color:#7D5A3C;margin:0 0 24px">${formatLongDate(entry.date)}</p>
    <div style="font-size:15px">${entry.content}</div>`;
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
    pdf.save(`${entry.title || 'entry'}.pdf`);
  } finally {
    page.remove();
  }
}
