import { expect, test } from "@playwright/test";

test("desktop navigation and homepage expose the three primary conversion paths", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const paths = page.getByTestId("conversion-paths-page");
  await expect(paths.getByRole("link", { name: /Book a Rental/ })).toHaveAttribute("href", "/book");
  await expect(paths.getByRole("link", { name: /Drive for Work/ })).toHaveAttribute("href", "/drive-for-work");
  await expect(paths.getByRole("link", { name: /List Your Vehicle/ })).toHaveAttribute("href", "/list-your-vehicle");

  await paths.getByRole("link", { name: /Drive for Work/ }).click();
  await expect(page).toHaveURL(/\/drive-for-work$/);
  const conversionEvent = await page.evaluate(() =>
    window.dataLayer?.find((event) => event.event === "conversion_path_selected"),
  );
  expect(conversionEvent).toMatchObject({
    conversion_intent: "driver",
    placement: "home_intent_selector",
  });
  await page.goto("/");

  const workMenu = page.getByRole("button", { name: "Work With Us" });
  await workMenu.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: /Drive for Work/ })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: /List Your Vehicle/ })).toBeVisible();
});

test("mobile menu leads with renter, driver and owner outcomes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();

  const drawer = page.getByRole("dialog");
  await expect(drawer.getByText("Choose your next step")).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Book a Rental", exact: true })).toHaveAttribute("href", "/book");
  await expect(drawer.getByRole("link", { name: "Drive for Work", exact: true })).toHaveAttribute("href", "/drive-for-work");
  await expect(drawer.getByRole("link", { name: "List Your Vehicle", exact: true })).toHaveAttribute("href", "/list-your-vehicle");

  await drawer.getByRole("link", { name: "Drive for Work", exact: true }).click();
  await expect(page).toHaveURL(/\/drive-for-work$/);
  await expect(page.getByRole("heading", { level: 1, name: "Need a car to earn?" })).toBeVisible();
});

for (const width of [320, 390, 768, 1440]) {
  test(`conversion entry points do not create horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    await page.goto("/");
    await expect(page.getByTestId("conversion-paths-page")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });
}
