/**
 * Whether cloud sync is available in this build.
 *
 * The deployed app has no Supabase project until the owner creates one and sets the two
 * variables. Without them every call would fail and the user would be told their
 * connection is at fault, so sync is simply off: the Account section is not rendered and
 * the app stays local-only, which is the honest default for a build with no backend.
 */
export function syncEnabled(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

/**
 * The Supabase project URL, or empty when sync is disabled.
 *
 * Read from `VITE_SUPABASE_URL`. The project origin also hosts Realtime, so the CSP
 * `connect-src` for the app allows `https://*.supabase.co` and `wss://*.supabase.co`.
 */
export function supabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL ?? '';
}

/** The anon key. Public by design: row-level security is what protects the data. */
export function supabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
}
