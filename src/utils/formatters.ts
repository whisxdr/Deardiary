/**
 * `Intl.DateTimeFormat` instances shared by the date helpers.
 *
 * Built once at module load: constructing a formatter is the expensive part, and these
 * are used on every card and reader page. Locale is pinned to `en-US` rather than the
 * browser default, because the interface text is English and a translated month name
 * beside English copy would read as a bug.
 */

const LOCALE = 'en-US';

export const longDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

export const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
