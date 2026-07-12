/**
 * Central validation for build-time environment configuration.
 *
 * Supabase's client throws an opaque, module-scope error ("supabaseUrl is
 * required.") the instant it's constructed with a missing value. Because
 * that construction used to happen at import time (client.ts -> AuthContext
 * -> App.tsx), the throw aborted the whole module graph before React ever
 * rendered anything, leaving a blank page with no diagnostic. This module is
 * the single place that decides whether the required variables are present,
 * so callers (main.tsx, the Supabase client) can react instead of crash.
 */

export interface SupabaseEnvConfig {
  url: string;
  publishableKey: string;
}

// A flat shape with optional fields rather than a discriminated union on
// `ok`: this project builds with strictNullChecks disabled (tsconfig.app.json
// sets "strict": false), under which `if (!x.ok)` does not reliably narrow a
// `{ ok: true; a } | { ok: false; b }` union — `x.b` still type-errors as
// "not on type '{ ok: true; a }'" inside that branch. Optional properties
// don't have this problem: with strictNullChecks off they resolve to their
// base type wherever they're read, so callers can check `ok` and then read
// `config`/`missing` directly, matching how this is actually used below.
export interface EnvValidationResult {
  ok: boolean;
  config?: SupabaseEnvConfig;
  missing?: string[];
}

function isPresent(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Never throws. Never logs values — only the names of missing keys.
 * Accepts an optional env source (defaults to the real `import.meta.env`)
 * so tests can exercise each combination without stubbing global state.
 */
export interface RawEnvSource {
  VITE_SUPABASE_URL: string | undefined;
  VITE_SUPABASE_PUBLISHABLE_KEY: string | undefined;
}

// Vite's ambient ImportMetaEnv only declares its own built-ins (BASE_URL,
// MODE, DEV, PROD, SSR) by name; custom VITE_* keys are reached only through
// its index signature, which TS won't structurally match against a target
// type's named properties in a default-parameter position. Read the real
// values once, through an explicit cast, so callers never have to think
// about this.
const REAL_ENV: RawEnvSource = import.meta.env as unknown as RawEnvSource;

export function validateSupabaseEnv(
  env: RawEnvSource = REAL_ENV,
): EnvValidationResult {
  const required = {
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY,
  } as const;

  const missing = Object.entries(required)
    .filter(([, value]) => !isPresent(value))
    .map(([name]) => name);

  if (missing.length > 0) {
    return { ok: false, missing };
  }

  return {
    ok: true,
    config: {
      url: required.VITE_SUPABASE_URL as string,
      publishableKey: required.VITE_SUPABASE_PUBLISHABLE_KEY as string,
    },
  };
}
