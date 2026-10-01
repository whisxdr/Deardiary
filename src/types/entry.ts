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
  deletedAt?: string;
}

/** Payload used when creating an entry; derived fields are computed by the service. */
export type EntryDraft = Omit<Entry, 'id' | 'createdAt' | 'updatedAt' | 'wordCount' | 'readingTime' | 'deletedAt'>;

/** Fields that may be patched on an existing entry. */
export type EntryUpdate = Partial<Omit<Entry, 'id' | 'createdAt' | 'deletedAt'>>;

/** Sort orders offered by the dashboard toolbar. */
export type SortOrder = 'newest' | 'oldest' | 'title' | 'mood';

/** Dashboard display modes. */
export type ViewMode = 'grid' | 'list';
