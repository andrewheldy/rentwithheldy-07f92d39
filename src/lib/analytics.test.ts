import { beforeEach, describe, expect, it, vi } from "vitest";
import { track } from "./analytics";

describe("analytics privacy bridge", () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.history.replaceState({}, "", "/drive-for-work?utm_source=partner&utm_campaign=launch");
  });

  it("drops sensitive properties before dispatch", () => {
    const listener = vi.fn();
    window.addEventListener("rentwithheldy:analytics", listener);

    track("driver_funnel_completed", {
      vehicle_category: "xl",
      email: "driver@example.com",
      phone_number: "5615550100",
      vin: "1FTBW3XG5RKA12345",
      first_name: "Alex",
    });

    expect(window.dataLayer?.[0]).toMatchObject({
      event: "driver_funnel_completed",
      vehicle_category: "xl",
      utm_source: "partner",
      utm_campaign: "launch",
    });
    expect(JSON.stringify(window.dataLayer)).not.toContain("driver@example.com");
    expect(JSON.stringify(window.dataLayer)).not.toContain("5615550100");
    expect(JSON.stringify(window.dataLayer)).not.toContain("1FTBW3XG5RKA12345");
    expect(JSON.stringify(window.dataLayer)).not.toContain("Alex");

    window.removeEventListener("rentwithheldy:analytics", listener);
  });
});
