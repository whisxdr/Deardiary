import { STORAGE_KEYS } from '@/constants';
import { readJson, writeJson } from '@/lib/storage';

/**
 * Highest logical stamp this device has ever observed, in milliseconds.
 *
 * Persisted rather than recomputed from the entries: a tombstone can be the newest record
 * and is still stored, but a clock that only looked at entries would step backwards after
 * a pull replaced the collection. The stored value is the high-water mark of everything
 * this device has seen, local and remote.
 */
function observed(): number {
  const stored = readJson<unknown>(STORAGE_KEYS.clock, 0);
  const value = typeof stored === 'number' && Number.isFinite(stored) ? stored : 0;
  return value;
}

/**
 * Records stamps seen from another device so this device's next write lands after them.
 *
 * Called with every pulled stamp after a sync pass. A device whose clock runs fast stamps
 * into the future; without adopting that stamp the correct device would keep minting
 * "older" writes, the server would reject them, and those edits would be lost.
 */
export function observeStamps(stamps: Iterable<string>): void {
  let highest = observed();
  for (const stamp of stamps) {
    const at = new Date(stamp).getTime();
    if (Number.isFinite(at) && at > highest) highest = at;
  }
  if (highest > observed()) writeJson(STORAGE_KEYS.clock, highest);
}

/**
 * The stamp for the next local write.
 *
 * `new Date()` alone is not enough once two devices share a collection: it does not
 * guarantee a write is newer than one already pulled from a fast-clocked device. Stepping
 * one millisecond past the highest observed stamp keeps stamps increasing in the order the
 * edits actually happened, which is all the merge needs. This is a logical clock, the cheap
 * version of the problem: it does not make the devices agree on the time, only on order.
 */
export function nextStamp(): string {
  const next = Math.max(Date.now(), observed() + 1);
  writeJson(STORAGE_KEYS.clock, next);
  return new Date(next).toISOString();
}
