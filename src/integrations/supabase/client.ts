// NOTE: originally auto-generated. A defensive configuration guard was added
// below — do not remove it when regenerating.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { validateSupabaseEnv } from '@/lib/env';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

const envResult = validateSupabaseEnv();

/**
 * True when the required Supabase env vars were present at build time.
 * `main.tsx` checks this (via `validateSupabaseEnv`) before ever importing
 * the App tree that pulls this module in, so `supabase` below is only
 * actually used once `isSupabaseConfigured` is true. The unconfigured
 * branch exists as a safety net for any other code path (tests, future
 * direct imports) that reaches this module without going through that gate.
 */
export const isSupabaseConfigured = envResult.ok;

if (!envResult.ok) {
  // Names only — never the values — so nothing secret reaches the console.
  console.error(
    `[supabase] Cannot initialize: missing required environment variable(s): ${envResult.missing.join(", ")}.`,
  );
}

/** Throws a clear, named error instead of silently no-op'ing if ever called unconfigured. */
function createUnconfiguredClient(missing: string[]): SupabaseClient<Database> {
  const message = `Supabase client was used before configuration was validated. Missing: ${missing.join(", ")}.`;
  return new Proxy({} as SupabaseClient<Database>, {
    get() {
      throw new Error(message);
    },
  });
}

export const supabase: SupabaseClient<Database> = envResult.ok
  ? createClient<Database>(envResult.config.url, envResult.config.publishableKey, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createUnconfiguredClient(envResult.missing);
