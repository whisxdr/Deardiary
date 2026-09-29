import { startOfWeek, endOfWeek, subDays } from 'date-fns';

/**
 * Weekly bucketing check.
 *
 * An entry on the last hour of the week must fall inside that week's bucket.
 * The old math used weekStart + 6 days, which lands on Saturday 00:00 and drops
 * the rest of Saturday.
 */
const now = new Date(2026, 8, 29); // Tue Sep 29 2026
const weekStart = startOfWeek(now);
const lastHourOfWeek = new Date(endOfWeek(weekStart).getTime() - 60_000); // Sat 23:59

const oldEnd = new Date(weekStart.getTime() + 6 * 86_400_000);
const newEnd = endOfWeek(weekStart);

const inOld = lastHourOfWeek.getTime() >= weekStart.getTime() && lastHourOfWeek.getTime() <= oldEnd.getTime();
const inNew = lastHourOfWeek.getTime() >= weekStart.getTime() && lastHourOfWeek.getTime() <= newEnd.getTime();

console.log('weekStart        :', weekStart.toString().slice(0, 24));
console.log('lastHourOfWeek   :', lastHourOfWeek.toString().slice(0, 24));
console.log('oldEnd           :', oldEnd.toString().slice(0, 24), '| counted:', inOld);
console.log('newEnd           :', newEnd.toString().slice(0, 24), '| counted:', inNew);

if (inOld) throw new Error('old math unexpectedly counted it; test is not exercising the bug');
if (!inNew) throw new Error('new math still drops the last hour of the week');
console.log('PASS: the final hours of the week are now counted');
