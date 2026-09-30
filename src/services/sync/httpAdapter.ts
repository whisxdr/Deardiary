import type { Entry } from '@/types';
import { coerceEntry, looksLikeEntry } from '../entryFields';
import type { PullResult, RemoteAdapter } from './types';

/** Raised when the server is unreachable or answers with an error status. */
export class RemoteError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'RemoteError';
  }
}

const BASE = '/api';

/**
 * Reference adapter: a small JSON API reached over HTTP.
 *
 * Requests carry `credentials: 'include'` so the session cookie travels with them. The
 * cookie is httpOnly and set by the server, so the session is not readable from the page
 * and cannot be exfiltrated by injected script.
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    // A network failure is not an HTTP status; give it one so callers have a single
    // shape to handle, and never let it look like a successful empty response.
    throw new RemoteError('The server could not be reached.', 0);
  }

  if (!response.ok) {
    throw new RemoteError(`The server rejected the request (${response.status}).`, response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const httpAdapter: RemoteAdapter = {
  async requestCode(email) {
    await request<{ ok: true }>('/auth/request-code', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async verifyCode(email, code) {
    const result = await request<{ email: string }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    return result?.email ? { email: result.email } : null;
  },

  async resume() {
    try {
      const result = await request<{ email: string }>('/auth/session');
      return result?.email ? { email: result.email } : null;
    } catch (error) {
      // 401 is the honest answer for an expired session; anything else is a real failure
      // and must not be reported as "signed out", or the user loses their session state.
      if (error instanceof RemoteError && error.status === 401) return null;
      throw error;
    }
  },

  async push(_account, entries) {
    if (entries.length === 0) return;
    await request<{ ok: true }>('/entries', { method: 'POST', body: JSON.stringify({ entries }) });
  },

  async pull() {
    const result = await request<PullResult>('/entries');
    const list = Array.isArray(result?.entries) ? result.entries : [];
    // Repair at the boundary. The merge and the write-back act on these records before
    // anything else validates them, and a record with no id would be keyed `undefined`
    // (two of them collapsing into one) or, if it won, would be written to storage and
    // then dropped by the next read — losing the local copy while the server kept the
    // broken one.
    const entries = list.filter(looksLikeEntry).map(coerceEntry);
    return { entries, serverTime: result?.serverTime ?? '' };
  },

  async signOut() {
    await request<{ ok: true }>('/auth/signout', { method: 'POST' });
  },
};

/** Convenience for callers that only need the type. */
export type { Entry };
