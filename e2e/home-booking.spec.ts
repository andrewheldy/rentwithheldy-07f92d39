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
  await page.route("**/sdk/wheelbase.min.js", (route) => route.abort());
});

test("homepage presents the assisted, self-serve, and fleet paths in order", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const hero = page.getByTestId("home-hero");
  await expect(hero.getByRole("link", { name: /Plan My Trip/i })).toHaveAttribute("href", "/trip-planner");
  await expect(hero.getByRole("link", { name: /Browse the Fleet/i })).toHaveAttribute("href", "/fleet");

  const booking = page.getByTestId("home-booking-widget");
  await expect(booking.getByRole("heading", { name: "When do you need a car?" })).toBeVisible();
  await expect(page.getByTestId("wheelbase-landing-widget")).toHaveAttribute("layout", "horizontal");

  const order = await page.evaluate(() => {
    const heroElement = document.querySelector('[data-testid="home-hero"]');
    const bookingElement = document.querySelector('[data-testid="home-booking-widget"]');
    const trustElement = document.querySelector('[data-testid="home-trust-strip"]');
    return Boolean(
      heroElement &&
        bookingElement &&
        trustElement &&
        heroElement.nextElementSibling === bookingElement &&
        bookingElement.nextElementSibling === trustElement,
    );
  });
  expect(order).toBe(true);
});

test("selected dates enter the existing /book flow through legacy filters", async ({ page }) => {
  await page.goto("/");
  const widget = page.getByTestId("wheelbase-landing-widget");
  await expect(widget).toBeVisible();

  await widget.evaluate((element) => {
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
      url: "/book?pickup=2026-08-20&return=2026-08-25",
    });
  });

  await expect(page).toHaveURL(/\/book\?wb-from=2026-08-20&wb-to=2026-08-25$/);
  const event = await page.evaluate(() =>
    window.dataLayer?.find((entry) => entry.event === "home_booking_widget_submit"),
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
