import { afterEach, describe, expect, it } from "vitest";
import {
  WHEELBASE_WIDGET_SRC,
  buildWheelbaseStoreUrl,
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

  it("builds the hosted store URL with locale and only Wheelbase trip params", () => {
    expect(buildWheelbaseStoreUrl("es")).toBe(
      "https://widget.wheelbasepro.com/?dealer_id=4913818&store_type=auto&locale=es-es",
    );
    expect(
      buildWheelbaseStoreUrl("he", "?wb_from=2026-08-20&wb_to=2026-08-25&wb_from_time=10:00&utm_source=x"),
    ).toBe(
      "https://widget.wheelbasepro.com/?dealer_id=4913818&store_type=auto&locale=en-us&wb_from=2026-08-20&wb_to=2026-08-25&wb_from_time=10%3A00",
    );
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
