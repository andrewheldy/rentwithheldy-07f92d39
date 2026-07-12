import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * ProtectedRoute reads isSupabaseConfigured at module scope (via
 * integrations/supabase/client), so — same as the other Supabase-adjacent
 * tests — each scenario needs a fresh module graph.
 */
async function renderProtectedRoute(url: string, key: string) {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", url);
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", key);

  const { AuthProvider } = await import("@/contexts/AuthContext");
  const { default: ProtectedRoute } = await import("./ProtectedRoute");

  render(
    <MemoryRouter>
      <AuthProvider>
        <ProtectedRoute requireAdmin>
          <div>Admin content</div>
        </ProtectedRoute>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute without Supabase configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("shows a controlled 'not configured' state instead of a login redirect or crash", async () => {
    await renderProtectedRoute("", "");

    expect(
      screen.getByText(/admin authentication is not configured/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument();
  });
});
