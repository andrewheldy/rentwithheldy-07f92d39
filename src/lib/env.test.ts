import { describe, expect, it } from "vitest";
import { validateSupabaseEnv } from "./env";

describe("validateSupabaseEnv", () => {
  it("returns ok with the config when both variables are present", () => {
    const result = validateSupabaseEnv({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
    });

    expect(result).toEqual({
      ok: true,
      config: {
        url: "https://example.supabase.co",
        publishableKey: "test-anon-key",
      },
    });
  });

  it("reports VITE_SUPABASE_URL as missing when absent", () => {
    const result = validateSupabaseEnv({
      VITE_SUPABASE_URL: undefined,
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
    });

    expect(result).toEqual({ ok: false, missing: ["VITE_SUPABASE_URL"] });
  });

  it("reports VITE_SUPABASE_PUBLISHABLE_KEY as missing when absent", () => {
    const result = validateSupabaseEnv({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: undefined,
    });

    expect(result).toEqual({
      ok: false,
      missing: ["VITE_SUPABASE_PUBLISHABLE_KEY"],
    });
  });

  it("reports both variables as missing when both are absent", () => {
    const result = validateSupabaseEnv({
      VITE_SUPABASE_URL: undefined,
      VITE_SUPABASE_PUBLISHABLE_KEY: undefined,
    });

    expect(result).toEqual({
      ok: false,
      missing: ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"],
    });
  });

  it("treats a whitespace-only value as missing", () => {
    const result = validateSupabaseEnv({
      VITE_SUPABASE_URL: "   ",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-anon-key",
    });

    expect(result).toEqual({ ok: false, missing: ["VITE_SUPABASE_URL"] });
  });
});
