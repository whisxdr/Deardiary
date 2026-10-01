import type { Entry } from '@/types';

/**
 * One row of the `entries` table, in the database's own snake_case shape.
 *
 * The mapper is the only place that knows this shape. Everything above it — merge, engine,
 * storage — speaks the `Entry` type, so a column rename is a one-file change.
 */
export interface EntryRow {
  id: string;
  owner_id: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  entry_date: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
  is_private: boolean;
  location: string | null;
  images: string[] | null;
  word_count: number;
  reading_time: number;
  deleted_at: string | null;
}

/** Maps a domain entry to a database row for the given owner. */
export function toRow(entry: Entry, ownerId: string): EntryRow {
  return {
    id: entry.id,
    owner_id: ownerId,
    title: entry.title,
    content: entry.content,
    mood: entry.mood,
    tags: entry.tags,
    entry_date: entry.date,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    is_favorite: entry.isFavorite,
    is_private: entry.isPrivate,
    location: entry.location ?? null,
    images: entry.images ?? null,
    word_count: entry.wordCount,
    reading_time: entry.readingTime,
    deleted_at: entry.deletedAt ?? null,
  };
}

/**
 * Maps a database row back to a domain entry.
 *
 * The result is a partial record on purpose: `coerceEntry` at the adapter boundary fills in
 * and validates every field, so a row written by an older schema or a hand-edited database
 * heals on the way in instead of reaching a component that assumes the shape.
 */
export function fromRow(row: EntryRow): Partial<Entry> {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    mood: row.mood as Entry['mood'],
    tags: row.tags,
    date: row.entry_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isFavorite: row.is_favorite,
    isPrivate: row.is_private,
    location: row.location ?? undefined,
    images: row.images ?? undefined,
    wordCount: row.word_count,
    readingTime: row.reading_time,
    deletedAt: row.deleted_at ?? undefined,
  };
}
