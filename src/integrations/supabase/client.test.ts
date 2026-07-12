import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * client.ts reads env at module-evaluation time, so each scenario needs a
 * fresh module instance. vi.resetModules() + a dynamic import gives us that
 * without touching the real process env used by other tests.
 */
async function loadClient(url: string, key: string) {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", url);
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", key);
  return import("./client");
}

describe("supabase client configuration guard", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("creates a working client when both variables are present", async () => {
    const { supabase, isSupabaseConfigured } = await loadClient(
      "https://example.supabase.co",
      "test-anon-key",
    );

    expect(isSupabaseConfigured).toBe(true);
    expect(() => supabase.auth).not.toThrow();
  });

  it("does not throw at import time and does not create a client when the URL is missing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const importPromise = loadClient("", "test-anon-key");
    await expect(importPromise).resolves.toBeDefined();

    const { supabase, isSupabaseConfigured } = await importPromise;
    expect(isSupabaseConfigured).toBe(false);
    expect(() => supabase.auth).toThrow(/VITE_SUPABASE_URL/);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const loggedMessage = errorSpy.mock.calls[0].join(" ");
    expect(loggedMessage).toContain("VITE_SUPABASE_URL");
    expect(loggedMessage).not.toContain("test-anon-key");
  });

  it("does not throw at import time and does not create a client when the publishable key is missing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { supabase, isSupabaseConfigured } = await loadClient(
      "https://example.supabase.co",
      "",
    );

    expect(isSupabaseConfigured).toBe(false);
    expect(() => supabase.auth).toThrow(/VITE_SUPABASE_PUBLISHABLE_KEY/);

    const loggedMessage = errorSpy.mock.calls[0].join(" ");
    expect(loggedMessage).toContain("VITE_SUPABASE_PUBLISHABLE_KEY");
  });

  it("does not throw at import time and does not create a client when both variables are missing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { supabase, isSupabaseConfigured } = await loadClient("", "");

    expect(isSupabaseConfigured).toBe(false);
    expect(() => supabase.auth).toThrow(
      /VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY/,
    );

    const loggedMessage = errorSpy.mock.calls[0].join(" ");
    expect(loggedMessage).toContain("VITE_SUPABASE_URL");
    expect(loggedMessage).toContain("VITE_SUPABASE_PUBLISHABLE_KEY");
  });
});
