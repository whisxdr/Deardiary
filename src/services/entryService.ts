/**
 * Entry storage, split by direction.
 *
 * Reading lives in `entryQuery`, writing in `entryWrite`. Both are re-exported here so
 * existing imports keep working; the split is what keeps each file inside the project's
 * service line limit.
 */
export { findEntry, listAllRecords, listEntries, listTags, saveEntries } from './entryQuery';
export {
  createEntry,
  deleteAllEntries,
  deleteEntry,
  replaceEntries,
  toggleFavorite,
  updateEntry,
} from './entryWrite';
