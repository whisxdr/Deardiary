/**
 * Dashboard URL that filters by one tag.
 *
 * Tags may contain spaces, `&` or `+`, so the value has to be encoded: unencoded,
 * `salt & pepper` parses as `tag=salt ` and `c++` as `c  `, and the dashboard then
 * shows no results for a tag the user just clicked.
 */
export function tagFilterUrl(path: string, tag: string): string {
  return `${path}?tag=${encodeURIComponent(tag)}`;
}

/** Same as {@link tagFilterUrl} for a free-text search query. */
export function searchFilterUrl(path: string, query: string): string {
  return `${path}?q=${encodeURIComponent(query)}`;
}
