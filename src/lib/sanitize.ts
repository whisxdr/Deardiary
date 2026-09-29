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

/**
 * Sanitizes entry HTML before it is rendered.
 *
 * The editor only ever writes safe markup, but an imported backup is arbitrary text
 * from a file the user chose, and it is stored and re-rendered as HTML. Stripping to
 * the editor's own tag set keeps a crafted backup from running script in the page.
 */
export function sanitizeEntryHtml(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Blocks `javascript:` and `data:` URLs on links and images.
    ALLOWED_URI_REGEXP: /^(?:https?|mailto|tel|data:image\/)/i,
  });
}
