import { expect, test, type Page } from "@playwright/test";
import { CONSIGNER_ID, OwnerBackend } from "./support/owner-backend";
import { expectCleanLayout } from "./support/layout-audit";

// Test data (support/owner-backend.ts): a 2019 Jetta consigned at 60% from
// Jan 1, 2026; one Turo trip a month Jan–Sep and one Wheelbase trip a month
// Mar–Sep; blocked Jun 10–14; today is Sep 29, 2026. Figures below are the
// owner's 60% share, worked out by hand.

const NOW = new Date("2026-09-29T16:00:00Z");

async function open(page: Page, as: "owner" | "admin" | "customer" = "owner", path = "/owner", language?: string) {
  const backend = new OwnerBackend();
  await page.clock.setFixedTime(NOW);
  if (language) await page.addInitScript((lang) => localStorage.setItem("rwh.lang", lang), language);
  await backend.install(page, { as });
  await page.goto(path);
  return backend;
}

test.describe("owner dashboard", () => {
  test("shows the owner's share, platform split and key metrics for this year", async ({ page }) => {
    await open(page);
    await expect(page.getByRole("heading", { level: 1, name: "2019 Volkswagen Jetta" })).toBeVisible();
    await expect(page.getByText("Active on Turo and Wheelbase")).toBeVisible();
    await expect(page.getByText("Amounts shown are your 60% share of rental revenue.")).toBeVisible();
    await expect(page.locator("#owner-range-dates")).toHaveText("Jan 1 – Dec 31, 2026");

    const kpis = page.getByRole("region", { name: "Analytics" });
    await expect(kpis.getByText("$4,950", { exact: true })).toBeVisible();
    await expect(kpis.getByText("$2,520", { exact: true })).toBeVisible();
    await expect(kpis.getByText("50.9% of total")).toBeVisible();
    await expect(kpis.getByText("$2,430", { exact: true })).toBeVisible();
    await expect(kpis.getByText("49.1% of total")).toBeVisible();
    await expect(kpis.getByText("29.2%", { exact: true })).toBeVisible();
    // The consignment started this year, so there's nothing earlier to compare with.
    await expect(kpis.getByText("No earlier period to compare")).toHaveCount(2);

    const summary = page.locator("dl").filter({ hasText: "Average Monthly Revenue" });
    await expect(summary).toContainText("$4,950.00");
    await expect(summary).toContainText("$550.00");

    const metrics = page.locator("dl").filter({ hasText: "Booked Days" });
    await expect(metrics.getByText("267", { exact: true })).toBeVisible();
    await expect(metrics.getByText("78", { exact: true })).toBeVisible();
    await expect(metrics.getByText("$63", { exact: true })).toBeVisible();
    await expect(metrics.getByText("4.9 days")).toBeVisible();

    // The chart's data table (for screen readers) has every month of the year.
    const table = page.getByRole("table", { name: "Monthly revenue by platform" });
    await expect(table.getByRole("row")).toHaveCount(13);
    await expect(table.getByRole("row", { name: /September 2026/ })).toContainText("$360.00");
    await expect(table.getByRole("row", { name: /September 2026/ })).toContainText("$654.00");
    await expect(table.getByRole("row", { name: /December 2026/ })).toContainText("$0.00");
  });

  test("compares a date range with the one before it", async ({ page }) => {
    await open(page);
    await page.getByRole("combobox", { name: "Date range" }).click();
    await page.getByRole("option", { name: "Last 90 days" }).click();
    await expect(page.locator("#owner-range-dates")).toHaveText("Jul 2 – Sep 29, 2026");
    const kpis = page.getByRole("region", { name: "Analytics" });
    await expect(kpis.getByText("$1,944", { exact: true })).toBeVisible();
    await expect(kpis.getByText("+2.9%")).toBeVisible();
    await expect(kpis.getByText("vs. previous period").first()).toBeVisible();
  });

  test("shows a tooltip with the month's platform split", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await open(page);
    const plot = page.locator(".recharts-wrapper").first();
    await plot.scrollIntoViewIfNeeded();
    await expect(page.locator(".recharts-bar-rectangle path").first()).toBeVisible();
    // September is the 9th month: hover its Turo segment.
    const box = (await page.locator(".recharts-bar-rectangles").last().locator(".recharts-bar-rectangle").nth(8).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const tooltip = page.locator(".recharts-tooltip-wrapper");
    await expect(tooltip).toContainText("September 2026");
    await expect(tooltip).toContainText("$654.00");
    await expect(tooltip).toContainText("$360.00");
    await expect(tooltip).toContainText("(55%)");
  });

  test("shows vehicle details and the owner's share", async ({ page }) => {
    await open(page, "owner", "/owner/vehicle");
    await expect(page.getByRole("heading", { level: 1, name: "Vehicle Details" })).toBeVisible();
    await expect(page.getByText("STLN58")).toBeVisible();
    await expect(page.getByText("3VWE57BU1KM119169")).toBeVisible();
    await expect(page.getByText("60%", { exact: true })).toBeVisible();
    await expect(page.getByText("Jan 1, 2026").first()).toBeVisible();
  });

  test("lists signed agreements and downloads the PDF", async ({ page }) => {
    const backend = await open(page, "owner", "/owner/documents");
    await expect(page.getByText("Agreement CON-2026-0001")).toBeVisible();
    await expect(page.getByText("Signed Dec 20, 2025")).toBeVisible();
    await page.getByRole("button", { name: "Download PDF" }).click();
    await expect.poll(() => backend.signedPaths).toEqual(["agr-1/final.pdf"]);
  });

  test("navigates with the sidebar and the account menu", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await open(page);
    const nav = page.getByRole("navigation", { name: "Owner dashboard" });
    await nav.getByRole("link", { name: "Vehicle Details" }).click();
    await expect(page).toHaveURL(/\/owner\/vehicle$/);
    await nav.getByRole("link", { name: "Documents" }).click();
    await expect(page).toHaveURL(/\/owner\/documents$/);
    await nav.getByRole("link", { name: "Analytics" }).click();
    await expect(page).toHaveURL(/\/owner$/);
    await expect(nav.getByRole("link", { name: "Analytics" })).toHaveAttribute("aria-current", "page");

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Account settings" }).click();
    await expect(page).toHaveURL(/\/owner\/settings$/);
    await expect(page.getByLabel("Full name")).toHaveValue("Jordan Owner");
  });

  test("sends owners to their dashboard from the account page and header", async ({ page }) => {
    await open(page, "owner", "/profile");
    await expect(page).toHaveURL(/\/owner$/);
    await page.goto("/about");
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole("link", { name: "Your account" })).toHaveAttribute("href", "/owner");
  });

  test("explains when an account isn't linked to a vehicle", async ({ page }) => {
    await open(page, "customer");
    await expect(page.getByRole("heading", { name: "Your account isn't linked to a vehicle yet" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", "/contact");
  });

  test("lets an admin preview a consigner's dashboard", async ({ page }) => {
    await open(page, "admin", "/owner");
    await expect(page).toHaveURL(/\/admin\/consigners$/);

    await page.goto(`/owner?as=${CONSIGNER_ID}`);
    await expect(page.getByText("Admin preview of Jordan Owner's dashboard. This is exactly what they see.")).toBeVisible();
    await expect(page.getByRole("region", { name: "Analytics" }).getByText("$4,950", { exact: true })).toBeVisible();
    // Links keep the preview.
    await page.getByRole("navigation", { name: "Owner dashboard" }).getByRole("link", { name: "Documents" }).click();
    await expect(page).toHaveURL(new RegExp(`/owner/documents\\?as=${CONSIGNER_ID}$`));
    await page.getByRole("button", { name: "Account menu" }).click();
    await expect(page.getByRole("menuitem", { name: "Sign out" })).toHaveCount(0);
  });

  for (const language of ["en", "es", "fr", "pt", "he"]) {
    for (const viewport of [
      { name: "mobile", width: 390, height: 844 },
      { name: "tablet", width: 820, height: 1180 },
      { name: "desktop", width: 1440, height: 900 },
    ]) {
      test(`has a clean layout in ${language} on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await open(page, "owner", "/owner", language);
        await expect(page.locator("html")).toHaveAttribute("dir", language === "he" ? "rtl" : "ltr");
        await expect(page.getByRole("heading", { level: 1, name: "2019 Volkswagen Jetta" })).toBeVisible();
        await expect(page.locator(".recharts-bar-rectangle path").first()).toBeVisible();
        await expectCleanLayout(page, `owner ${language} ${viewport.name}`);
        await page.goto("/owner/vehicle");
        await expect(page.getByText("STLN58")).toBeVisible();
        await expectCleanLayout(page, `owner vehicle ${language} ${viewport.name}`);
      });
    }
  }
});
