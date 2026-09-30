// Imported from its own module rather than the `@/components/book` barrel: the barrel
// also exports BookFlip and BookPage, which import Framer Motion, and this ribbon is on
// the first paint for every visitor.
import { Bookmark } from '@/components/book/Bookmark';

/** Ribbon bookmark hanging from the top edge of the cover. */
export function CoverBookmark() {
  return (
    <div className="absolute left-1/2 top-0 -translate-x-1/2">
      <Bookmark label="Your place in the book" animate />
    </div>
  );
}
