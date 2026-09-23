import { expect, test } from "@playwright/test";

// Guest-facing service pages send the primary hero CTA to the Wheelbase
// booking flow (/book) instead of the fleet gallery.
const BOOK_NOW_PAGES = [
  "/fort-lauderdale-airport-car-rental",
  "/hotel-concierge-rentals",
  "/cruise-port-delivery",
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("rwh.lang", "en"));
});

for (const path of BOOK_NOW_PAGES) {
  test(`${path}: hero primary CTA is Book Now → /book`, async ({ page }) => {
    await page.goto(path);
    const hero = page.locator("main section").first();
    await expect(hero.getByRole("link", { name: "Book Now" })).toHaveAttribute("href", "/book");
    await expect(page.getByText("View available vehicles")).toHaveCount(0);
  });
}

test("hotel: Explore hotel delivery scrolls to the guest booking form", async ({ page }) => {
  await page.goto("/hotel-concierge-rentals");
  const cta = page.locator("main section").first().getByRole("link", { name: "Explore hotel delivery" });
  await expect(cta).toHaveAttribute("href", "#quick-quote");
  await cta.click();
  await expect(page).toHaveURL(/#quick-quote$/);
  await expect(page.locator("#quick-quote form")).toBeInViewport();
});

test("hotel and body shop pages no longer show the partner intake form", async ({ page }) => {
  await page.goto("/hotel-concierge-rentals");
  await expect(page.getByText("Concierge or Hotel GM?")).toHaveCount(0);
  await expect(page.locator("#pi-company")).toHaveCount(0);

  await page.goto("/body-shop-delivery");
  await expect(page.getByText(/Run a body shop or mechanic shop\?/)).toHaveCount(0);
  await expect(page.locator("#pi-company")).toHaveCount(0);
  // The guest replacement-rental form stays.
  await expect(page.locator("#quick-quote form")).toBeAttached();
});
