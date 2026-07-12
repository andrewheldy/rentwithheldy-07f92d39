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
 * Supabase backs admin auth/fleet-management and public lead-capture forms —
 * it is not required for the public site to render. Callers that only run on
 * user-initiated actions (form submit, admin routes) should check this (or
 * just try/catch) rather than assume `supabase` works; nothing here runs
 * automatically on page load.
 */
export const isSupabaseConfigured = envResult.ok;

if (!envResult.ok) {
  // Names only — never the values — so nothing secret reaches the console.
  console.error(
    `[supabase] Cannot initialize: missing required environment variable(s): ${envResult.missing.join(", ")}.`,
  );
}

let cachedClient: SupabaseClient<Database> | null = null;

/** Constructs the real client on first use only — never at module load. */
function getRealClient(): SupabaseClient<Database> {
  if (!envResult.ok) {
    throw new Error(
      `Supabase client was used but is not configured. Missing: ${envResult.missing.join(", ")}.`,
    );
  }
  if (!cachedClient) {
    cachedClient = createClient<Database>(envResult.config.url, envResult.config.publishableKey, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return cachedClient;
}

/**
 * Lazy proxy: merely importing this module (or holding a reference to
 * `supabase`) never constructs a client or touches `import.meta.env` beyond
 * the cheap presence check above. A real client is created on first actual
 * property access, and only if configured — otherwise that access throws a
 * clear, named error. Every consumer must already treat Supabase calls as
 * fallible (network errors, RLS denials); this is one more fallible case,
 * not a new failure mode, and callers should catch it the same way.
 */
export const supabase: SupabaseClient<Database> = new Proxy(
  {} as SupabaseClient<Database>,
  {
    get(_target, prop) {
      const client = getRealClient();
      const value = Reflect.get(client as object, prop, client);
      return typeof value === "function" ? value.bind(client) : value;
    },
  },
);
