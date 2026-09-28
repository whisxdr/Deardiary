import { Bookmark } from '@/components/book';

/** Ribbon bookmark hanging from the top edge of the cover. */
export function CoverBookmark() {
  return (
    <div className="absolute left-1/2 top-0 -translate-x-1/2">
      <Bookmark label="Your place in the book" animate />
    </div>
  );
}
