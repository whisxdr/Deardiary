/** Generic async request state used by pages that load remote-shaped data. */
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

/** Filter values shared by the toolbar and the search hook. */
export interface EntryFilters {
  query: string;
  mood: string;
  tag: string;
  favoritesOnly: boolean;
  dateFrom: string;
  dateTo: string;
  sort: string;
}

/** Select option rendered by the toolbar dropdowns. */
export interface SelectOption {
  value: string;
  label: string;
}

/** Result of a clipboard write attempt. */
export interface ShareResult {
  ok: boolean;
  message: string;
}
