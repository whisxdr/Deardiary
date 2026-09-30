import { useLocation } from 'react-router-dom';
import Write from './Write';

/**
 * Remounts the composer for every write request.
 *
 * `/write` and `/write/:id` are separate routes that render the same component, and the
 * router reuses that instance when only the params change. The Tiptap body outlived the
 * switch, so "New entry" opened a clean form over the previous entry's text and the next
 * keystroke saved that text into the new entry. Remounting also flushes the pending
 * autosave for the entry being left, which the reset alone dropped.
 *
 * `location.key` is per history entry, so pressing "New entry" while already composing
 * starts over instead of being a no-op.
 */
export default function WriteRoute() {
  const location = useLocation();
  return <Write key={location.key} />;
}
