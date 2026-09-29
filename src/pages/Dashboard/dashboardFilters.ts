import type { Entry, SelectOption } from '@/types';

/**
 * Tag choices for the toolbar, derived from the entries in use.
 *
 * A tag that arrived from a link stays selectable even when no entry currently uses it,
 * so the control never shows a value that is missing from its own option list.
 */
export function tagOptionsFor(entries: Entry[], urlTag: string): SelectOption[] {
  const tags = new Set<string>();
  entries.forEach((entry) => entry.tags.forEach((tag) => tags.add(tag)));

  const options = Array.from(tags)
    .sort((a, b) => a.localeCompare(b))
    .map((tag) => ({ value: tag, label: `#${tag}` }));

  if (urlTag !== 'all' && !tags.has(urlTag)) options.unshift({ value: urlTag, label: `#${urlTag}` });
  return [{ value: 'all', label: 'All tags' }, ...options];
}
