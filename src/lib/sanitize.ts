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
 * Restricts URLs to the schemes the editor can produce, which is stricter than DOMPurify's
 * default. DOMPurify checks this regex against every attribute that is not URI-safe, so
 * `target` and `rel` must be declared safe below or their values (`_blank`, `noopener`)
 * fail the check and the attributes are dropped.
 */
const ALLOWED_URI_REGEXP = /^(?:https?|mailto|tel|data:image\/)/i;

/** `target` and `rel` hold non-URL values, so they are exempt from `ALLOWED_URI_REGEXP`. */
const URI_SAFE_ATTR = ['target', 'rel'];

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
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP,
    ADD_URI_SAFE_ATTR: URI_SAFE_ATTR,
  });
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
 *
 * The event-handler branch requires a tag before the `on...=`, so prose such as
 * `money = 20` or `one=1` does not match. It also requires two or more letters after
 * `on`, which is deliberate: `on[a-z]{2,}` still matches every real HTML handler
 * (`onclick`, `onerror`, ...) and cannot match a word like `one`, so plain entries
 * never pay for the repair pass. A handler missed here is still stripped by the
 * sanitizer below, so the tradeoff leans towards skipping the rewrite, never towards
 * weaker sanitization.
 */
export function looksUnsafe(html: string): boolean {
  if (!html) return false;
  return /<\s*(script|iframe|object|embed|style|svg|math|form)\b|<[a-z][a-z0-9]*[^>]*[\s"'/]on[a-z]{2,}\s*=|javascript:|data:text\/html/i.test(
    html,
  );
}
