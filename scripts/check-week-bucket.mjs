import { endOfWeek, startOfWeek } from '../src/utils/week.ts';
import { subDays } from '../src/utils/month.ts';
import { toDateKey } from '../src/utils/date.ts';

/**
 * Weekly bucketing and calendar-day checks.
 *
 * Runs against the app's own helpers rather than a library, so the check fails if the
 * bucketing or the DST-safe day stepping regresses. Run: `node scripts/check-week-bucket.mjs`
 */

// --- Weekly bucket includes the last hours of the week -------------------------------
const now = new Date(2026, 8, 29); // Tue Sep 29 2026
const weekStart = startOfWeek(now);
const lastHourOfWeek = new Date(endOfWeek(weekStart).getTime() - 60_000); // Sat 23:59

// The old math: weekStart + 6 days lands on Saturday 00:00 and drops the rest of the day.
const oldEnd = new Date(weekStart.getTime() + 6 * 86_400_000);
const newEnd = endOfWeek(weekStart);

const inOld = lastHourOfWeek.getTime() >= weekStart.getTime() && lastHourOfWeek.getTime() <= oldEnd.getTime();
const inNew = lastHourOfWeek.getTime() >= weekStart.getTime() && lastHourOfWeek.getTime() <= newEnd.getTime();

console.log('weekStart      :', weekStart.toString().slice(0, 24));
console.log('lastHourOfWeek :', lastHourOfWeek.toString().slice(0, 24));
console.log('oldEnd         :', oldEnd.toString().slice(0, 24), '| counted:', inOld);
console.log('newEnd         :', newEnd.toString().slice(0, 24), '| counted:', inNew);

if (inOld) throw new Error('old math unexpectedly counted it; test is not exercising the bug');
if (!inNew) throw new Error('new math still drops the last hour of the week');
console.log('PASS: the final hours of the week are counted');

// --- subDays steps whole calendar days ----------------------------------------------
// Across a DST boundary the local clock shifts, so a fixed 24h subtraction can skip a day.
const beforeDst = new Date(2026, 2, 10, 0, 30); // Mar 10 2026, 00:30 local
const stepped = subDays(beforeDst, 1);
const expectedKey = toDateKey(new Date(2026, 2, 9));
const actualKey = toDateKey(stepped);
console.log('subDays        :', actualKey, '(expected', expectedKey + ')');
if (actualKey !== expectedKey) throw new Error('subDays skipped a calendar day');
console.log('PASS: subDays steps exactly one calendar day');
