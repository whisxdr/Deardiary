import { stripHtml, textToHtml } from '@/utils';

/** Characters escaped when building HTML fragments. */
const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes HTML special characters in plain text. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

/** Plain text of an HTML body, safe to place in JSON or filenames. */
export function htmlToText(html: string): string {
  return stripHtml(html);
}

/** Wraps plain text in paragraphs, escaping markup. */
export function plainToHtml(text: string): string {
  return textToHtml(escapeHtml(text));
}

/** True when the HTML body has no visible text. */
export function isHtmlEmpty(html: string): boolean {
  return stripHtml(html).length === 0;
}

/** Word count of an HTML body, used before persisting an entry. */
export function htmlWordCount(html: string): number {
  const text = stripHtml(html);
  return text ? text.split(' ').filter(Boolean).length : 0;
}

/** Converts an HTML body to a Markdown-ish plain text export. */
export function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gis, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gis, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gis, '### $1\n\n')
    .replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gis, '**$2**')
    .replace(/<(em|i)[^>]*>(.*?)<\/\1>/gis, '_$2_')
    .replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
