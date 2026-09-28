/** Hard limits enforced by the editor and the tag input. */
export const LIMITS = {
  maxTags: 10,
  tagMaxLength: 24,
  titleMaxLength: 120,
  contentMaxLength: 20_000,
  maxImages: 6,
  virtualizeThreshold: 100,
} as const;

/** Timing values shared by autosave, search and animation helpers. */
export const TIMING = {
  autosaveIntervalMs: 5_000,
  searchDebounceMs: 300,
  savedIndicatorMs: 2_000,
  toastDurationMs: 3_000,
} as const;
