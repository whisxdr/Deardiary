/** Splits an array into chunks of at most `size` items. */
export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Returns a new array with duplicate values removed, preserving order. */
export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

/** Returns a new array sorted by the numeric value returned from `pick`. */
export function sortBy<T>(items: T[], pick: (item: T) => number, direction: 'asc' | 'desc' = 'asc'): T[] {
  const factor = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => (pick(a) - pick(b)) * factor);
}

/** Groups items by a key derived from each item. */
export function groupBy<T>(items: T[], keyOf: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = keyOf(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

/** Counts how many times each value appears. */
export function countBy<T>(items: T[], keyOf: (item: T) => string): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = keyOf(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
