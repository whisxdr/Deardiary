/** Route paths used by the router and by navigation links. */
export const ROUTES = {
  landing: '/',
  dashboard: '/dashboard',
  write: '/write',
  writeEntry: (id: string) => `/write/${id}`,
  reader: (id: string) => `/entry/${id}`,
  calendar: '/calendar',
  stats: '/stats',
  settings: '/settings',
} as const;

/** Reader route pattern, kept separate because it carries a param. */
export const READER_PATTERN = '/entry/:id';

/** Write route pattern for editing an existing entry. */
export const WRITE_ENTRY_PATTERN = '/write/:id';
