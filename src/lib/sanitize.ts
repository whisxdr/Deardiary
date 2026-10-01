import DOMPurify from 'dompurify';

/**
 * Tags and attributes the editor can produce, plus the image and link attributes it
 * needs. Anything outside this list is dropped.
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'h1',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'hr',
  'a',
  'img',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'title'];

/** Blocks `javascript:` and `data:` URLs, allowing images and normal links. */
const ALLOWED_URI_REGEXP = /^(?:https?|mailto|tel|data:image\/)/i;

/**
 * Sanitizes entry HTML.
 *
 * The editor only ever writes safe markup, but an imported backup is arbitrary text from
 * a file the user chose. Stripping to the editor's own tag set keeps a crafted record
 * from running script wherever the value is later rendered as HTML — the reader injects
 * it, and the PDF export builds a live DOM node from it.
 *
 * Links get `rel="noopener noreferrer"` forced on. A record with
 * `<a href="https://evil" target="_blank">` would otherwise hand the opened page a
 * `window.opener` handle back into the diary.
 */
export function sanitizeEntryHtml(html: string): string {
  if (!html) return '';
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOWED_URI_REGEXP });
  return clean.replace(/<a\s([^>]*target\s*=\s*["']?_blank["']?[^>]*)>/gi, (tag) =>
    /rel\s*=/.test(tag) ? tag.replace(/rel\s*=\s*["'][^"']*["']/i, 'rel="noopener noreferrer"') : tag.replace(/>$/, ' rel="noopener noreferrer">'),
  );
}

/**
 * Cheap pre-check for markup that could execute.
 *
 * A regex is not the defense — `sanitizeEntryHtml` is. This only decides whether a
 * stored record is worth a sanitizer pass, so the repair-on-read path stays free for
 * ordinary entries and still catches a record that predates the sanitizer.
 */
export function looksUnsafe(html: string): boolean {
  if (!html) return false;
  return /<\s*(script|iframe|object|embed|style|svg|math|form)\b|on[a-z]+\s*=|javascript:|data:text\/html/i.test(
    html,
  );
}
