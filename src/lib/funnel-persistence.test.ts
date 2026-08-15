import { describe, expect, it, vi } from "vitest";
import { clearFunnelDraft, getLeadAttribution, loadFunnelDraft, saveFunnelDraft } from "./funnel-persistence";

describe("funnel persistence", () => {
  it("restores a non-expired draft and step", () => {
    saveFunnelDraft("test-funnel", { category: "xl" }, 4);
    expect(loadFunnelDraft("test-funnel", { category: "" })).toEqual({
      data: { category: "xl" },
      step: 4,
    });
  });

  it("drops expired drafts", () => {
    localStorage.setItem(
      "expired-funnel",
      JSON.stringify({ expiresAt: Date.now() - 1, step: 8, data: { category: "xl" } }),
    );
    expect(loadFunnelDraft("expired-funnel", { category: "" })).toEqual({
      data: { category: "" },
      step: 0,
    });
    expect(localStorage.getItem("expired-funnel")).toBeNull();
  });

  it("clears successful submissions", () => {
    saveFunnelDraft("clear-funnel", { category: "premium" }, 2);
    clearFunnelDraft("clear-funnel");
    expect(localStorage.getItem("clear-funnel")).toBeNull();
  });

  it("falls back when storage contains invalid data", () => {
    localStorage.setItem("broken-funnel", "not-json");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(loadFunnelDraft("broken-funnel", { category: "" })).toEqual({
      data: { category: "" },
      step: 0,
    });
    warn.mockRestore();
  });

  it("keeps campaign attribution while stripping referrer query data", () => {
    window.history.replaceState({}, "", "/drive-for-work?utm_source=partner&utm_campaign=launch");
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://partner.example/path?email=private%40example.com#details",
    });

    expect(getLeadAttribution("/drive-for-work")).toEqual({
      source: "partner",
      campaign: "launch",
      referrer: "https://partner.example/path",
      landingPage: "/drive-for-work",
    });
  });
});
