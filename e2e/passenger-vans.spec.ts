import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const analyticsEvents: string[] = [];
    Object.defineProperty(window, "__rwhAnalyticsEvents", {
      value: analyticsEvents,
      configurable: true,
    });
    window.addEventListener("rentwithheldy:analytics", ((event: CustomEvent) => {
      analyticsEvents.push(event.detail.event);
    }) as EventListener);
  });
  await page.route("**/rest/v1/leads*", async (route) => {
    await route.fulfill({ status: 201, contentType: "application/json", body: "[]" });
  });
  await page.route("**/api/send-booking-email", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
});

test("renders the specialty page, metadata, selector, gallery and Wheelbase handoff", async ({ page }) => {
  await page.route("https://d3cuf6g1arkgx6.cloudfront.net/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
  });
  await page.goto("/passenger-vans");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("14-Passenger Van Rentals");
  await expect(page).toHaveTitle(/14-Passenger Van Rental Miami/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://rentwithheldy.com/passenger-vans",
  );
  await expect.poll(async () =>
    page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
      scripts.some((script) => script.textContent?.includes("FAQPage")),
    ),
  ).toBe(true);

  const heroImage = page.getByAltText(/Black 2024 Ford Transit 350 HD/);
  await expect(heroImage).toBeVisible();
  await expect.poll(() => heroImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(1000);

  await page.getByRole("tab", { name: "Concierge" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("Need passenger-van inventory");

  await page.getByRole("button", { name: /Open photo gallery: 2018 Ford Transit 350/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Close photo gallery" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  const documentWidth = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(documentWidth.scroll).toBeLessThanOrEqual(documentWidth.client + 1);

  await page.getByRole("link", { name: "Book a Van" }).click();
  await expect(page).toHaveURL(/\/book$/);
  await expect(page.getByTestId("wheelbase-widget")).toBeVisible();

  const events = await page.evaluate(() =>
    (window as Window & { __rwhAnalyticsEvents: string[] }).__rwhAnalyticsEvents,
  );
  expect(events).toContain("passenger_vans_page_view");
  expect(events).toContain("passenger_vans_use_case_select");
  expect(events).toContain("passenger_vans_wheelbase_launch");
});

test("submits renter and consignment inquiries through the existing lead flow", async ({ page }) => {
  await page.goto("/passenger-vans");

  const rental = page.locator("#passenger-van-inquiry form");
  await rental.locator("#pv-name").fill("Test Renter");
  await rental.locator("#pv-phone").fill("5615550199");
  await rental.locator("#pv-email").fill("renter@example.com");
  await rental.locator("#pv-start").fill("2026-09-10");
  await rental.locator("#pv-end").fill("2026-09-13");
  await rental.locator("#pv-passengers").fill("12");
  await rental.locator("#pv-trip-type").selectOption("sports_team");
  await rental.locator("#pv-vehicle").selectOption("2024-transit-350-hd");
  await rental.locator("#pv-area").fill("Fort Lauderdale");
  await rental.locator("#pv-message").fill("Tournament weekend");
  await rental.getByRole("button", { name: "Send an Inquiry" }).click();
  await expect(page.getByRole("heading", { name: "We have your van request." })).toBeVisible();

  await page.getByRole("button", { name: "Consign Your Van" }).click();
  const consignment = page.locator("#consignment-form form");
  await consignment.locator("#consign-name").fill("Test Owner");
  await consignment.locator("#consign-phone").fill("5615550100");
  await consignment.locator("#consign-email").fill("owner@example.com");
  await consignment.locator("#consign-year").fill("2022");
  await consignment.locator("#consign-make").fill("Ford");
  await consignment.locator("#consign-model").fill("Transit 350");
  await consignment.locator("#consign-capacity").fill("14");
  await consignment.locator("#consign-mileage").fill("45000");
  await consignment.locator("#consign-location").fill("Miami");
  await consignment.locator("#consign-condition").fill("Clean and regularly maintained");
  await consignment.getByRole("button", { name: "Send Vehicle for Review" }).click();
  await expect(page.getByRole("heading", { name: "Your vehicle is in review." })).toBeVisible();

  const events = await page.evaluate(() =>
    (window as Window & { __rwhAnalyticsEvents: string[] }).__rwhAnalyticsEvents,
  );
  expect(events).toContain("passenger_vans_inquiry_start");
  expect(events).toContain("passenger_vans_inquiry_submit");
  expect(events).toContain("passenger_vans_consignment_start");
  expect(events).toContain("passenger_vans_consignment_submit");
});

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
]) {
  test(`${viewport.name} layout has no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/passenger-vans");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
    if (viewport.name === "mobile") {
      await expect(page.getByRole("link", { name: "Book Van" })).toBeVisible();
    }
  });
}

test("honors reduced motion and remains usable in Hebrew RTL", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("rwh.lang", "he"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/passenger-vans");

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("14");
  await expect.poll(() =>
    page.locator(".reveal").first().evaluate((element) => getComputedStyle(element).opacity),
  ).toBe("1");

  const dimensions = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
});
