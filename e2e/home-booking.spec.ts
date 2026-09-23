import { expect, test } from "@playwright/test";

const currentWheelbaseStub = `
  class LandingWidgetStub extends HTMLElement {
    connectedCallback() {
      this.style.display = 'block';
      this.style.width = '100%';
      this.innerHTML = '<div style="min-height:96px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;align-items:center"><button style="min-height:48px">Pick-up date</button><button style="min-height:48px">Return date</button><button style="min-height:48px">Check Availability</button></div>';
    }
  }
  customElements.define('landing-widget', LandingWidgetStub);
`;

test.beforeEach(async ({ page }) => {
  await page.route("**/latest/wheelbase-widget.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: currentWheelbaseStub }),
  );
  await page.route("https://widget.wheelbasepro.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<main>Wheelbase store</main>" }),
  );
});

test("hero leads with the booking date picker in place of the old CTAs", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const hero = page.getByTestId("home-hero");
  await expect(hero.getByTestId("home-booking-widget")).toBeVisible();
  await expect(hero.getByRole("link", { name: /Plan My Trip/i })).toHaveCount(0);
  await expect(hero.getByRole("link", { name: /Browse the Fleet/i })).toHaveCount(0);

  const widget = page.getByTestId("wheelbase-landing-widget");
  await expect(widget).toHaveAttribute("layout", "horizontal");
  await expect(widget).toHaveAttribute(
    "target-url",
    "https://widget.wheelbasepro.com/?dealer_id=4913818&store_type=auto&locale=en-us",
  );
});

test("selected dates go straight to the hosted Wheelbase store", async ({ page }) => {
  await page.goto("/");
  const widget = page.getByTestId("wheelbase-landing-widget");
  await expect(widget).toBeVisible();

  const event = await widget.evaluate((element) => {
    const landing = element as HTMLElement & {
      onSubmit: (payload: {
        pickup: Date;
        returnDate: Date;
        url: string;
      }) => void;
    };
    landing.onSubmit({
      pickup: new Date(2026, 7, 20, 12),
      returnDate: new Date(2026, 7, 25, 12),
      url: "https://widget.wheelbasepro.com/?dealer_id=4913818&store_type=auto&wb_from=2026-08-20&wb_to=2026-08-25",
    });
    return window.dataLayer?.find((entry) => entry.event === "home_booking_widget_submit");
  });
  await page.waitForURL(
    "https://widget.wheelbasepro.com/?dealer_id=4913818&store_type=auto&locale=en-us&wb_from=2026-08-20&wb_to=2026-08-25",
  );
  expect(event).toMatchObject({
    source: "homepage",
    locale: "en",
    trip_length_days: 5,
  });
  expect(event).not.toHaveProperty("pickup");
  expect(event).not.toHaveProperty("returnDate");
});

for (const width of [320, 375, 390, 768, 1024, 1440]) {
  test(`booking entry does not overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    await page.goto("/");
    const widget = page.getByTestId("wheelbase-landing-widget");
    await expect(widget).toBeVisible();
    await expect(widget).toHaveAttribute("layout", width < 768 ? "full" : "horizontal");

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });
}
