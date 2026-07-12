import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * insertLead wraps the raw `supabase.from("leads").insert()` call; each
 * scenario needs a fresh client module so the (un)configured state actually
 * takes effect, same approach as integrations/supabase/client.test.ts.
 */
async function loadInsertLead(url: string, key: string) {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", url);
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", key);
  const { insertLead } = await import("./leads");
  return insertLead;
}

describe("insertLead", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns a { error } result instead of throwing when Supabase is not configured", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const insertLead = await loadInsertLead("", "");

    const result = await insertLead({ form_type: "quick_quote", name: "Jane", phone: "5555550100" });

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toContain("not configured");
  });

  it("never rejects — callers can always safely destructure { error }", async () => {
    const insertLead = await loadInsertLead("", "");

    await expect(
      insertLead({ form_type: "quick_quote", name: "Jane", phone: "5555550100" }),
    ).resolves.toBeDefined();
  });
});
