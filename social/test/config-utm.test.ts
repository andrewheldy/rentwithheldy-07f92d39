// @vitest-environment node
import { describe, expect, it } from "vitest";
import { loadConfig, resolveDryRun } from "../src/config.js";
import { redact, redactValue, registerSecrets } from "../src/log.js";
import { buildLink } from "../src/utm.js";
import { dayBounds, recentDays } from "../src/dates.js";

describe("DRY_RUN resolution", () => {
  it("defaults to dry run unless DRY_RUN is exactly false", () => {
    expect(resolveDryRun({}).dryRun).toBe(true);
    expect(resolveDryRun({ DRY_RUN: "true" }).dryRun).toBe(true);
    expect(resolveDryRun({ DRY_RUN: "FALSE " }).dryRun).toBe(true);
    expect(resolveDryRun({ DRY_RUN: "0" }).dryRun).toBe(true);
    expect(resolveDryRun({ DRY_RUN: "false" }).dryRun).toBe(false);
  });

  it("lets a manual run only make things drier", () => {
    expect(resolveDryRun({ DRY_RUN: "false", DISPATCH_DRY_RUN: "true" }).dryRun).toBe(true);
    expect(resolveDryRun({ DRY_RUN: "true", DISPATCH_DRY_RUN: "false" }).dryRun).toBe(true);
  });

  it("never goes live off the default branch in Actions", () => {
    const actions = { DRY_RUN: "false", GITHUB_ACTIONS: "true" };
    expect(resolveDryRun({ ...actions, GITHUB_REF_NAME: "feature/x", DEFAULT_BRANCH: "main" })).toMatchObject({ dryRun: true });
    expect(resolveDryRun({ ...actions, GITHUB_REF_NAME: "main" }).dryRun).toBe(true);
    expect(resolveDryRun({ ...actions, GITHUB_REF_NAME: "main", DEFAULT_BRANCH: "main" }).dryRun).toBe(false);
  });

  it("loads optional modules only when complete", () => {
    const config = loadConfig({ GBP_ENABLED: "true", GBP_CLIENT_ID: "x" });
    expect(config.gbp).toBeNull();
    expect(config.gbpEnabledFlag).toBe(true);
    expect(config.supabase).toBeNull();
    expect(config.meta.igAccessToken).toBeNull();
    expect(loadConfig({ FB_PAGE_ACCESS_TOKEN: "page-token" }).meta.igAccessToken).toBe("page-token");
  });
});

describe("buildLink", () => {
  it("adds UTM parameters and keeps existing query and hash", () => {
    expect(buildLink("https://rentwithheldy.com/fort-lauderdale-airport-car-rental", { source: "instagram", campaign: "fll-delivery-oct", content: "2026-10-25-airport-delivery" })).toBe(
      "https://rentwithheldy.com/fort-lauderdale-airport-car-rental?utm_source=instagram&utm_medium=social&utm_campaign=fll-delivery-oct&utm_content=2026-10-25-airport-delivery",
    );
    expect(buildLink("https://rentwithheldy.com/book?lang=es#top", { source: "gbp", campaign: "c" })).toBe(
      "https://rentwithheldy.com/book?lang=es&utm_source=gbp&utm_medium=social&utm_campaign=c#top",
    );
    expect(buildLink("https://rentwithheldy.com/?utm_source=old", { source: "tiktok", campaign: "c" })).toContain("utm_source=tiktok");
  });
});

describe("redaction", () => {
  it("removes registered secrets and token-shaped values", () => {
    registerSecrets(["super-secret-token-value"]);
    expect(redact("failed with super-secret-token-value")).toBe("failed with [redacted]");
    expect(redact("GET https://graph.facebook.com/v26.0/me?access_token=EAAB123&fields=id")).toBe(
      "GET https://graph.facebook.com/v26.0/me?access_token=[redacted]&fields=id",
    );
    expect(redact("Authorization: Bearer abc.def")).toBe("Authorization: Bearer [redacted]");
    expect(redactValue({ access_token: "x", nested: { refresh_token: "y", ok: 1 } })).toEqual({
      access_token: "[redacted]",
      nested: { refresh_token: "[redacted]", ok: 1 },
    });
  });
});

describe("dates", () => {
  it("computes New York day bounds across DST", () => {
    expect(dayBounds("2026-10-24", "America/New_York")).toEqual({
      since: Date.parse("2026-10-24T04:00:00Z") / 1000,
      until: Date.parse("2026-10-25T04:00:00Z") / 1000,
    });
    // Nov 1 2026 is 25 hours long in New York.
    const fallBack = dayBounds("2026-11-01", "America/New_York");
    expect(fallBack.until - fallBack.since).toBe(25 * 3600);
  });

  it("lists complete days before today", () => {
    expect(recentDays(new Date("2026-10-18T07:15:00Z"), "America/New_York", 2)).toEqual(["2026-10-16", "2026-10-17"]);
  });
});
