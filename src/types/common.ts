/** Filter values shared by the toolbar and the URL query string. */
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
