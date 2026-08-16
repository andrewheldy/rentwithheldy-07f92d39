import { afterEach, describe, expect, it } from "vitest";
import {
  WHEELBASE_WIDGET_SRC,
  getTripLengthDays,
  getWheelbaseLocale,
  loadWheelbaseComponents,
  toCanonicalWheelbaseDate,
} from "./wheelbase";

describe("Wheelbase current SDK helpers", () => {
  afterEach(() => {
    document.querySelectorAll(`script[src="${WHEELBASE_WIDGET_SRC}"]`).forEach((script) => script.remove());
  });

  it.each([
    ["en", "en-us"],
    ["en-US", "en-us"],
    ["es-MX", "es-es"],
    ["fr-CA", "fr-fr"],
    ["pt-BR", "en-us"],
    ["he-IL", "en-us"],
  ])("maps %s to the safe Wheelbase locale", (siteLocale, wheelbaseLocale) => {
    expect(getWheelbaseLocale(siteLocale)).toBe(wheelbaseLocale);
  });

  it("converts Wheelbase dates without shifting the selected local day", () => {
    expect(toCanonicalWheelbaseDate("2026-08-20")).toBe("2026-08-20");
    expect(toCanonicalWheelbaseDate(new Date(2026, 7, 25, 23, 30))).toBe("2026-08-25");
    expect(getTripLengthDays("2026-08-20", "2026-08-25")).toBe(5);
  });

  it("shares one script load across concurrent mounts and reports failure", async () => {
    const first = loadWheelbaseComponents();
    const second = loadWheelbaseComponents();

    expect(first).toBe(second);
    const scripts = document.querySelectorAll(`script[src="${WHEELBASE_WIDGET_SRC}"]`);
    expect(scripts).toHaveLength(1);

    const firstRejection = expect(first).rejects.toThrow("failed to load");
    const secondRejection = expect(second).rejects.toThrow("failed to load");
    scripts[0].dispatchEvent(new Event("error"));
    await Promise.all([firstRejection, secondRejection]);
  });
});
