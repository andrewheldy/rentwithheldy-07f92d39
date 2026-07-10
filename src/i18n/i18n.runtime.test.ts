import { describe, it, expect, beforeEach } from "vitest";
import i18n, { loadLocale } from "./index";
import { LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from "./config";

// These exercise the live i18next singleton (detection cache, fallback, the
// html dir/lang side effect wired in ./index).
describe("i18n runtime", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("defaults to English and resolves real copy", () => {
    expect(i18n.language).toMatch(/^en/);
    expect(i18n.t("actions.bookNow", { ns: "common" })).toBe("Book Now");
    expect(i18n.t("links.fleet", { ns: "navigation" })).toBe("Fleet");
  });

  it("falls back to English for an untranslated locale (never a raw key)", async () => {
    await i18n.changeLanguage("es");
    await loadLocale("es"); // empty {} bundles in Phase 1
    expect(i18n.t("actions.bookNow", { ns: "common" })).toBe("Book Now");
    expect(i18n.t("footer:cta.heading")).toBe("Ready when you are.");
  });

  it("persists a manual selection to localStorage", async () => {
    await i18n.changeLanguage("fr");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("fr");
  });

  it("sets dir=rtl on <html> for Hebrew and restores ltr on switch back", async () => {
    await i18n.changeLanguage("he");
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    expect(document.documentElement.getAttribute("lang")).toBe("he");

    await i18n.changeLanguage("en");
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
    expect(document.documentElement.getAttribute("lang")).toBe("en");
  });

  it("never returns an empty string or raw key for a known key in any locale", async () => {
    for (const lng of SUPPORTED_LOCALES) {
      await i18n.changeLanguage(lng);
      const value = i18n.t("actions.bookNow", { ns: "common" });
      expect(value).toBe("Book Now"); // English until Phase 2 translations land
      expect(value).not.toBe("");
    }
  });
});
