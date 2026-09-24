import { expect, test, type Page } from "@playwright/test";

// Airport and hotel quote forms save to Supabase and email the team via
// /api/send-booking-email. A guest only sees the failure toast when BOTH paths
// fail. All network calls are mocked; nothing real is submitted.

type Outcome = { db: number; email: number };

async function mockBackends(page: Page, { db, email }: Outcome) {
  const emailBodies: Record<string, unknown>[] = [];
  await page.route("**/rest/v1/leads**", (route) =>
    route.fulfill({
      status: db,
      contentType: "application/json",
      body: db < 300 ? "" : JSON.stringify({ code: "23514", message: "check constraint" }),
    }),
  );
  await page.route("**/api/send-booking-email", (route) => {
    emailBodies.push(route.request().postDataJSON());
    return route.fulfill({
      status: email,
      contentType: "application/json",
      body: JSON.stringify(email < 300 ? { ok: true } : { error: "fail" }),
    });
  });
  return emailBodies;
}

async function fillAirport(page: Page) {
  await page.goto("/fort-lauderdale-airport-car-rental");
  await page.locator("#aq-name").fill("Test Guest");
  await page.locator("#aq-phone").fill("5555550100");
  await page.locator("#aq-airport").click();
  await page.getByRole("option", { name: /Miami International/ }).click();
  await page.locator("#aq-arrivalDateTime").fill("Oct 1 at 10am");
  await page.locator("#aq-returnDateTime").fill("Oct 5 at 2pm");
  await page.locator("#aq-name").locator("xpath=ancestor::form").getByRole("button").last().click();
}

async function fillHotel(page: Page) {
  await page.goto("/hotel-concierge-rentals");
  await page.locator("#hq-name").fill("Test Guest");
  await page.locator("#hq-phone").fill("5555550100");
  await page.locator("#hq-hotelName").fill("Test Hotel");
  await page.locator("#hq-pickupDateTime").fill("Oct 1 at 10am");
  await page.locator("#hq-returnDateTime").fill("Oct 5 at 2pm");
  await page.locator("#hq-name").locator("xpath=ancestor::form").getByRole("button").last().click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("rwh.lang", "en"));
});

for (const [label, fill, source] of [
  ["airport", fillAirport, "airport-trip"],
  ["hotel", fillHotel, "hotel-guest"],
] as const) {
  test(`${label}: succeeds via email when the database insert fails`, async ({ page }) => {
    const emails = await mockBackends(page, { db: 400, email: 200 });
    await fill(page);
    await expect(page.getByText("Got it — we've logged your request", { exact: true })).toBeVisible();
    await expect(page.getByText("Couldn't save your request", { exact: true })).toHaveCount(0);
    expect(emails).toHaveLength(1);
    expect(emails[0]).toMatchObject({ source, name: "Test Guest", phone: "5555550100" });
  });

  test(`${label}: shows the call fallback only when both paths fail`, async ({ page }) => {
    await mockBackends(page, { db: 400, email: 500 });
    await fill(page);
    await expect(page.getByText("Couldn't save your request", { exact: true })).toBeVisible();
  });
}
