import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAnonKey, supabaseUrl, syncEnabled } from './config';

/**
 * The Supabase client, created on first use.
 *
 * `@supabase/supabase-js` is imported dynamically rather than at the top of the file. It
 * declares almost no side effects, but a static import still puts the whole client library
 * in the chunk of every module that reaches this one — including the `@/services` barrel,
 * which the local-only pages import for unrelated helpers. A local-only user never signs in,
 * so the library must not be in their initial bundle. The promise is cached so the import
 * and the client happen once.
 */
let clientPromise: Promise<SupabaseClient> | null = null;

/** The shared client, or null when the build has no Supabase project configured. */
export function getSupabase(): Promise<SupabaseClient> | null {
  if (!syncEnabled()) return null;
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(supabaseUrl(), supabaseAnonKey(), {
        auth: {
          // Keep the session in localStorage so a reload stays signed in, and refresh it in
          // the background. `detectSessionInUrl` stays on so an email link also works, but
          // the one-time code path is the primary one.
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }),
    );
  }
  return clientPromise;
}
