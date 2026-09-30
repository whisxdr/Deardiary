import { listAllRecords } from './entryQuery';

/** Newest `updatedAt` this device has ever stored, in milliseconds. */
function highestStamp(): number {
  let highest = 0;
  listAllRecords().forEach((entry) => {
    const at = new Date(entry.updatedAt).getTime();
    if (Number.isFinite(at) && at > highest) highest = at;
  });
  return highest;
}

/**
 * The stamp for the next write.
 *
 * `new Date()` alone is not enough once two devices share a collection. A device whose
 * clock runs fast stamps into the future, and every later edit from a device whose clock
 * is correct then looks *older* than it, so the server rejects it and that edit is lost.
 *
 * Stepping past the newest stamp this device has seen keeps stamps increasing in the
 * order the edits actually happened: the device with the fast clock already pulled its own
 * stamp, so its next edit still lands after it. This is a logical clock, which is the
 * cheap version of the problem — it does not make the two devices agree on the time, only
 * on the order of their writes, and that is all the merge needs.
 */
export function nextStamp(): string {
  const next = Math.max(Date.now(), highestStamp() + 1);
  return new Date(next).toISOString();
}
