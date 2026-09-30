/** Mood identifiers supported by the diary. */
export type Mood =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'tired'
  | 'thoughtful'
  | 'loved'
  | 'cool'
  | 'anxious'
  | 'excited'
  | 'calm'
  | 'adoring'
  | 'mindblown';

/** Presentation metadata for a single mood. */
export interface MoodMeta {
  id: Mood;
  label: string;
  color: string;
  description: string;
}

/** A single diary entry. */
export interface Entry {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
  date: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  isPrivate: boolean;
  location?: string;
  images?: string[];
  wordCount: number;
  readingTime: number;
  /**
   * Set when the entry was deleted, instead of removing it from storage.
   *
   * A removed record cannot be told apart from one that was never uploaded, so a delete
   * was invisible to any future sync and the entry came back on the next pull. The
   * tombstone keeps the id so the deletion is a fact that can travel.
   */
  deletedAt?: string;
}

/** Payload used when creating an entry; derived fields are computed by the service. */
export type EntryDraft = Omit<Entry, 'id' | 'createdAt' | 'updatedAt' | 'wordCount' | 'readingTime'>;

/** Fields that may be patched on an existing entry. */
export type EntryUpdate = Partial<Omit<Entry, 'id' | 'createdAt'>>;

/** Sort orders offered by the dashboard toolbar. */
export type SortOrder = 'newest' | 'oldest' | 'title' | 'mood';

/** Dashboard display modes. */
export type ViewMode = 'grid' | 'list';
