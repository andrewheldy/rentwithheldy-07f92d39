import { describe, it, expect } from "vitest";
import { normalizeLocale, isSupportedLocale } from "./config";
import { getDirection, isRTL, applyDocumentDirection } from "./direction";

describe("normalizeLocale", () => {
  it("passes through supported base locales", () => {
    for (const l of ["en", "es", "fr", "pt", "he"]) {
      expect(normalizeLocale(l)).toBe(l);
    }
  });

  it("collapses regional variants to the base language", () => {
    expect(normalizeLocale("es-MX")).toBe("es");
    expect(normalizeLocale("es-US")).toBe("es");
    expect(normalizeLocale("fr-CA")).toBe("fr");
    expect(normalizeLocale("pt-BR")).toBe("pt");
    expect(normalizeLocale("pt-PT")).toBe("pt");
    expect(normalizeLocale("he-IL")).toBe("he");
    expect(normalizeLocale("en_US")).toBe("en");
  });

  it("falls back to English for unsupported or empty input", () => {
    expect(normalizeLocale("de")).toBe("en");
    expect(normalizeLocale("zh-CN")).toBe("en");
    expect(normalizeLocale("")).toBe("en");
    expect(normalizeLocale(null)).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
  });
});

describe("isSupportedLocale", () => {
  it("recognizes supported locales only", () => {
    expect(isSupportedLocale("he")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("de")).toBe(false);
    expect(isSupportedLocale("es-MX")).toBe(false); // base only
    expect(isSupportedLocale(null)).toBe(false);
  });
});

describe("direction", () => {
  it("marks Hebrew RTL and everything else LTR", () => {
    expect(getDirection("he")).toBe("rtl");
    expect(getDirection("he-IL")).toBe("rtl");
    expect(isRTL("he")).toBe(true);
    for (const l of ["en", "es", "fr", "pt"]) {
      expect(getDirection(l)).toBe("ltr");
      expect(isRTL(l)).toBe(false);
    }
  });

  it("defaults unknown locales to LTR", () => {
    expect(getDirection("de")).toBe("ltr");
  });

  it("reflects lang + dir onto <html>", () => {
    applyDocumentDirection("he");
    expect(document.documentElement.getAttribute("lang")).toBe("he");
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");

    applyDocumentDirection("es-MX");
    expect(document.documentElement.getAttribute("lang")).toBe("es");
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
  });
});
