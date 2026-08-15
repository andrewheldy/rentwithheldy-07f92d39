import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    __rwhAnalyticsDetails: Array<Record<string, unknown>>;
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__rwhAnalyticsDetails = [];
    window.addEventListener("rentwithheldy:analytics", ((event: CustomEvent) => {
      window.__rwhAnalyticsDetails.push(event.detail);
    }) as EventListener);
  });
});

const next = (page: Page, label = "Continue") =>
  page.getByRole("button", { name: label, exact: true }).click();

test("driver funnel handles conditional branches, persistence, submission and safe analytics", async ({ page, context }) => {
  let submittedBody: Record<string, unknown> | null = null;
  await page.route("**/api/submit-acquisition-lead", async (route) => {
    submittedBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ status: 201, contentType: "application/json", body: '{"ok":true,"notificationSent":true}' });
  });

  await page.goto("/drive-for-work?utm_source=concierge&utm_campaign=driver_launch");
  await expect(page).toHaveTitle(/Rideshare & Gig Driver Car Rentals/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://rentwithheldy.com/drive-for-work");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Need a car to earn?");

  await page.locator('input[value="uber"]').check();
  await page.locator('input[value="empower"]').check();
  await page.locator('input[value="delivery_apps"]').check();
  await next(page);
  const preReloadAnalytics = await page.evaluate(() => window.__rwhAnalyticsDetails);
  expect(preReloadAnalytics.map((event) => event.event)).toContain("driver_platform_selected");

  await page.locator('input[value="uber_eats"]').check();
  await next(page);
  await page.locator('input[value="uberxl"]').check();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Which Uber opportunity interests you?" })).toBeVisible();
  await expect(page.locator('input[value="uberxl"]')).toBeChecked();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("heading", { name: "Which delivery apps interest you?" })).toBeVisible();
  await next(page);
  await next(page);

  await page.locator('input[value="no"]').check();
  const referral = page.getByRole("link", { name: "Become an Empower Driver" });
  await expect(referral).toHaveAttribute("href", "https://example.invalid/empower-referral-test");
  const popupPromise = context.waitForEvent("page");
  await referral.click();
  const popup = await popupPromise;
  await popup.close();
  await next(page);

  await page.locator('input[value="xl"]').check();
  await next(page);
  await page.locator('input[value="asap"]').check();
  await next(page);
  await page.locator('input[value="350_399"]').check();
  await next(page);
  await page.locator('input[value="currently_driving"]').check();
  await next(page);
  await page.locator('input[name="current-platforms"][value="uber"]').check();
  await next(page);
  await page.locator('input[value="long_term"]').check();
  await next(page);
  await page.locator("#driver-zip").fill("33301");
  await next(page);
  await page.locator("#driver-firstName").fill("Alex");
  await page.locator("#driver-lastName").fill("Driver");
  await page.locator("#driver-phone").fill("5615550199");
  await page.locator("#driver-email").fill("alex.driver@example.com");

  const storedDraft = await page.evaluate(() => localStorage.getItem("rwh.driver-demand.v1"));
  expect(storedDraft).not.toContain("alex.driver@example.com");
  expect(storedDraft).not.toContain("5615550199");
  expect(storedDraft).not.toContain("33301");

  await next(page, "Join the Vehicle List");
  await expect(page.getByRole("heading", { name: "You’re on the list." })).toBeVisible();
  expect(submittedBody).toMatchObject({
    leadType: "driver_demand",
    vehicleCategory: "xl",
    needTimeline: "asap",
    weeklyBudget: "350_399",
    empowerStatus: "no",
    empowerReferralClicked: true,
    source: "concierge",
    campaign: "driver_launch",
  });
  expect(await page.evaluate(() => localStorage.getItem("rwh.driver-demand.v1"))).toBeNull();

  const analytics = await page.evaluate(() => window.__rwhAnalyticsDetails);
  const analyticsJson = JSON.stringify(analytics);
  expect(analytics.map((event) => event.event)).toEqual(
    expect.arrayContaining([
      "drive_for_work_view",
      "driver_funnel_started",
      "driver_vehicle_category_selected",
      "driver_budget_selected",
      "empower_referral_clicked",
      "driver_funnel_completed",
    ]),
  );
  expect(analyticsJson).not.toContain("alex.driver@example.com");
  expect(analyticsJson).not.toContain("5615550199");
});

test("vehicle funnel captures structured supply and keeps VIN out of analytics and persistence", async ({ page }) => {
  let submittedBody: Record<string, unknown> | null = null;
  await page.route("**/api/submit-acquisition-lead", async (route) => {
    submittedBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ status: 201, contentType: "application/json", body: '{"ok":true,"notificationSent":true}' });
  });

  await page.goto("/list-your-vehicle");
  await expect(page).toHaveTitle(/List Your Car With Rent With Heldy/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://rentwithheldy.com/list-your-vehicle");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your car could be earning.");

  await page.locator("#supply-year").fill("2024");
  await page.locator("#supply-make").fill("Ford");
  await page.locator("#supply-model").fill("Transit 350 HD");
  await page.locator("#supply-trim").fill("XLT");
  await next(page);
  await page.locator('input[value="passenger_van"]').check();
  await next(page);
  await page.locator('input[value="12_14"]').check();
  await next(page);
  await page.locator("#supply-mileage").fill("18000");
  const preReloadAnalytics = await page.evaluate(() => window.__rwhAnalyticsDetails);
  expect(preReloadAnalytics.map((event) => event.event)).toContain("consignment_vehicle_type_selected");
  await page.reload();
  await expect(page.getByRole("heading", { name: "About how many miles are on it?" })).toBeVisible();
  await expect(page.locator("#supply-mileage")).toHaveValue("18000");
  await next(page);
  await page.locator('input[value="excellent"]').check();
  await next(page);
  await page.locator('input[value="financed"]').check();
  await next(page);
  await page.locator('input[value="most_of_month"]').check();
  await next(page);
  await page.locator("#supply-zip").fill("33101");
  await next(page);
  await expect(page.getByText("We’ll request photos during review.")).toBeVisible();
  await next(page);
  await page.locator("#supply-vin").fill("1FTBW3XG5RKA12345");
  await next(page);
  await page.locator("#supply-firstName").fill("Taylor");
  await page.locator("#supply-lastName").fill("Owner");
  await page.locator("#supply-phone").fill("5615550110");
  await page.locator("#supply-email").fill("owner@example.com");

  const storedDraft = await page.evaluate(() => localStorage.getItem("rwh.vehicle-supply.v1"));
  expect(storedDraft).not.toContain("1FTBW3XG5RKA12345");
  expect(storedDraft).not.toContain("owner@example.com");
  expect(storedDraft).not.toContain("33101");

  await next(page, "Send My Vehicle");
  await expect(page.getByRole("heading", { name: "Thanks. We’ll take a look." })).toBeVisible();
  expect(submittedBody).toMatchObject({
    leadType: "vehicle_supply",
    vehicleYear: 2024,
    vehicleMake: "Ford",
    vehicleModel: "Transit 350 HD",
    vehicleType: "passenger_van",
    passengerCapacity: "12_14",
    mileage: 18000,
    vin: "1FTBW3XG5RKA12345",
  });
  expect(await page.evaluate(() => localStorage.getItem("rwh.vehicle-supply.v1"))).toBeNull();

  const analytics = await page.evaluate(() => window.__rwhAnalyticsDetails);
  const analyticsJson = JSON.stringify(analytics);
  expect(analytics.map((event) => event.event)).toEqual(
    expect.arrayContaining([
      "list_vehicle_view",
      "consignment_funnel_started",
      "consignment_funnel_completed",
    ]),
  );
  expect(analyticsJson).not.toContain("1FTBW3XG5RKA12345");
  expect(analyticsJson).not.toContain("owner@example.com");
});

test("validation, keyboard controls and legacy route transition work", async ({ page }) => {
  await page.goto("/rent-to-own");
  await expect(page).toHaveURL(/\/drive-for-work$/);

  await page.goto("/list-your-vehicle");
  await page.locator("#supply-year").fill("2024");
  await page.locator("#supply-make").fill("Honda");
  await page.locator("#supply-model").fill("CR-V");
  await next(page);
  await page.locator('input[value="suv_crossover"]').check();
  await next(page);
  await page.locator("#supply-mileage").fill("-1");
  await next(page);
  await expect(page.getByRole("alert")).toContainText("Please review this step");
  await expect(page.getByRole("heading", { name: "About how many miles are on it?" })).toBeVisible();
  await page.locator("#supply-mileage").fill("60000");
  await next(page);
  await page.locator('input[value="good"]').focus();
  await page.keyboard.press("Space");
  await expect(page.locator('input[value="good"]')).toBeChecked();
});

test("hidden conditional answers are cleared when a driver or vehicle choice changes", async ({ page }) => {
  await page.goto("/drive-for-work");
  await page.locator('input[value="uber"]').check();
  await page.locator('input[value="lyft"]').check();
  await next(page);
  await page.locator('input[value="uberx"]').check();
  await next(page);
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await page.locator('input[value="uber"]').uncheck();
  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem("rwh.driver-demand.v1")))
    .not.toContain("uber:uberx");
  await next(page);
  await expect(page.getByRole("heading", { name: "Which Lyft opportunity interests you?" })).toBeVisible();

  await page.goto("/list-your-vehicle");
  await page.locator("#supply-year").fill("2024");
  await page.locator("#supply-make").fill("Ford");
  await page.locator("#supply-model").fill("Transit");
  await next(page);
  await page.locator('input[value="passenger_van"]').check();
  await next(page);
  await page.locator('input[value="12_14"]').check();
  await page.getByRole("button", { name: "Back" }).click();
  await page.locator('input[value="suv_crossover"]').check();
  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem("rwh.vehicle-supply.v1")))
    .not.toContain('"passengerCapacity":"12_14"');
});

for (const viewport of [
  { name: "small mobile", width: 320, height: 720 },
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
]) {
  for (const route of ["/drive-for-work", "/list-your-vehicle"] as const) {
    test(`${route} has no overflow at ${viewport.name}`, async ({ page }) => {
      const browserErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });
      page.on("pageerror", (error) => browserErrors.push(error.message));
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
      await expect(page.locator("form").first()).toBeVisible();
      expect(browserErrors).toEqual([]);
    });
  }
}

test("funnels respect reduced motion and Hebrew RTL", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("rwh.lang", "he"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/drive-for-work");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const animationDuration = await page.locator("form .animate-fade-in").evaluate((element) => getComputedStyle(element).animationDuration);
  expect(["0.01ms", "1e-05s"]).toContain(animationDuration);
  const dimensions = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
});
