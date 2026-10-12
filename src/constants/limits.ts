/** Hard limits enforced by the editor and the tag input. */
export const LIMITS = {
  maxTags: 10,
  tagMaxLength: 24,
  titleMaxLength: 120,
  contentMaxLength: 20_000,
  locationMaxLength: 120,
  maxImages: 6,
  /** Refused before any decoding work; a larger file cannot survive compression anyway. */
  imageFileMaxBytes: 10 * 1024 * 1024,
  /** Longest side after downscaling. Entries live in a ~5 MB localStorage quota. */
  imageMaxDimension: 1600,
  imageQuality: 0.8,
  imageAspectRatio: 4 / 3,
  /**
   * Above this many entries the dashboard grid virtualizes.
   *
   * Each card is a few dozen nodes, so a hundred of them was the point where a phone
   * started holding thousands of nodes for cards nobody scrolled to. Thirty keeps a
   * screenful rendered plus overscan at every size the grid switches between.
   */
  virtualizeThreshold: 30,
} as const;

/** Timing values shared by autosave, search and animation helpers. */
export const TIMING = {
  autosaveIntervalMs: 5_000,
  searchDebounceMs: 300,
  toastDurationMs: 3_000,
  /** Idle window before the editor recounts words/characters after a keystroke. */
  counterDebounceMs: 250,
} as const;
