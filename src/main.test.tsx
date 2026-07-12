import { afterEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";

/**
 * main.tsx has no exports — it mounts on import. Each scenario needs a
 * fresh module graph (fresh env, fresh #root) since the mount decision is
 * made once, synchronously relative to import, inside a `.then()`.
 */
async function bootWithEnv(url: string, key: string) {
  document.body.innerHTML = '<div id="root"></div>';
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", url);
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", key);
  await import("./main.tsx");
  // The valid-config path dynamically imports the full App (router + every
  // page); that module graph load can comfortably exceed waitFor's 1s default.
  await waitFor(
    () => {
      expect(document.getElementById("root")?.innerHTML.length).toBeGreaterThan(0);
    },
    { timeout: 8000 },
  );
}

describe("app bootstrap with missing Supabase configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it(
    "mounts the app normally when both variables are present",
    async () => {
      await bootWithEnv("https://example.supabase.co", "test-anon-key");

      const root = document.getElementById("root")!;
      expect(root.innerHTML.length).toBeGreaterThan(0);
      expect(root.querySelector('[data-testid="config-error-screen"]')).toBeNull();
    },
    10000,
  );

  it("renders the branded config-error screen (not a blank #root) when the URL is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await bootWithEnv("", "test-anon-key");

    const root = document.getElementById("root")!;
    expect(root.innerHTML.length).toBeGreaterThan(0);
    expect(root.querySelector('[data-testid="config-error-screen"]')).not.toBeNull();
  });

  it("renders the branded config-error screen (not a blank #root) when the publishable key is missing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await bootWithEnv("https://example.supabase.co", "");

    const root = document.getElementById("root")!;
    expect(root.innerHTML.length).toBeGreaterThan(0);
    expect(root.querySelector('[data-testid="config-error-screen"]')).not.toBeNull();
  });

  it("renders the branded config-error screen (not a blank #root) when both variables are missing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await bootWithEnv("", "");

    const root = document.getElementById("root")!;
    expect(root.innerHTML.length).toBeGreaterThan(0);
    expect(root.querySelector('[data-testid="config-error-screen"]')).not.toBeNull();

    // The console diagnostic names the missing variables, never any value.
    const logged = errorSpy.mock.calls.map((call) => call.join(" ")).join("\n");
    expect(logged).toContain("VITE_SUPABASE_URL");
    expect(logged).toContain("VITE_SUPABASE_PUBLISHABLE_KEY");
  });
});
