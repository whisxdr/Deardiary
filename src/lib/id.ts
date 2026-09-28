import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

/** Namespace used when a deterministic id is required. */
const NAMESPACE = '6f4a1c2e-9b3d-4e5f-8a71-2c0d9e6b4f31';

/** Random unique id for entries and drafts. */
export function createId(): string {
  return uuidv4();
}

/** Deterministic id derived from a seed string, used by seed data and imports. */
export function createIdFrom(seed: string): string {
  return uuidv5(seed, NAMESPACE);
}

/** Short id used for DOM element ids (labels, aria targets). */
export function shortId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
