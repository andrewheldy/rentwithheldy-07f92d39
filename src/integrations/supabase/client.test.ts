import { describe, expect, it } from "vitest";
import { isSupabaseConfigured, supabase } from "./client";

describe("Supabase client bootstrap", () => {
  it("creates a client without crashing when build-time configuration is absent", () => {
    expect(typeof isSupabaseConfigured).toBe("boolean");
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });
});
