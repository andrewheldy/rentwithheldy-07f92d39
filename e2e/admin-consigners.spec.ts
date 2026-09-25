import { expect, test, type Page } from "@playwright/test";
import { ConsignerBackend, EQUINOX, JETTA, OWNER_ACCOUNT } from "./support/consigner-backend";
import { expectCleanLayout } from "./support/layout-audit";

const FIXED_NOW = new Date("2026-09-25T12:00:00.000Z");

async function openAsAdmin(page: Page, path = "/admin/consigners") {
  const backend = new ConsignerBackend();
  await page.clock.setFixedTime(FIXED_NOW);
  await backend.install(page, { asAdmin: true });
  await page.goto(path);
  return backend;
}

async function assignJetta(page: Page, share = "60") {
  await page.getByRole("button", { name: "Assign vehicle" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Assign a vehicle" });
  await dialog.getByRole("combobox", { name: "Owner's account" }).click();
  await page.getByRole("option", { name: /Test Owner/ }).click();
  await expect(dialog.getByLabel("Legal name")).toHaveValue("Test Owner");
  await dialog.getByRole("combobox", { name: "Vehicle" }).click();
  await page.getByRole("option", { name: /2019 Volkswagen Jetta · White · STLN58/ }).click();
  await dialog.getByLabel("Owner's share (%)").fill(share);
  await dialog.getByRole("button", { name: "Assign vehicle" }).click();
  await expect(dialog).toBeHidden();
}

test.describe("admin sidebar", () => {
  test("links every admin section and marks the current one", async ({ page }) => {
    await openAsAdmin(page, "/admin");
    await expect(page).toHaveURL(/\/admin\/consigners$/);

    const nav = page.getByRole("navigation", { name: "Admin sections" });
    const expected: Array<[string, RegExp]> = [
      ["Consigners", /\/admin\/consigners$/],
      ["Blog posts", /\/admin\/blog$/],
      ["New post", /\/admin\/blog\/new$/],
      ["Photos", /\/admin\/photos$/],
      ["Leads", /\/admin\/leads$/],
      ["Agreements", /\/admin\/agreements$/],
      ["Vehicles", /\/addcars$/],
    ];
    for (const [name, url] of expected) {
      await nav.getByRole("link", { name }).click();
      await expect(page).toHaveURL(url);
      await expect(nav.getByRole("link", { name })).toHaveAttribute("aria-current", "page");
      // One page title per screen, from the shared title bar.
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    }
    await expect(nav.getByRole("link", { name: "Blog posts" })).not.toHaveAttribute("aria-current", "page");
  });

  test("collapses to icons on desktop and keeps the page usable", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openAsAdmin(page);
    const sidebar = page.locator('[data-sidebar="sidebar"]').first();
    const before = (await sidebar.boundingBox())!.width;
    await page.getByRole("button", { name: "Toggle admin menu" }).click();
    await expect.poll(async () => (await sidebar.boundingBox())!.width).toBeLessThan(before / 2);
    await expectCleanLayout(page, "desktop collapsed sidebar");
  });

  test("opens as a sheet on mobile and closes after navigating", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openAsAdmin(page);
    await expectCleanLayout(page, "mobile consigners");
    await expect(page.getByRole("link", { name: "Leads" })).toBeHidden();
    await page.getByRole("button", { name: "Toggle admin menu" }).click();
    await page.getByRole("link", { name: "Leads" }).click();
    await expect(page).toHaveURL(/\/admin\/leads$/);
    await expect(page.getByRole("link", { name: "Leads" })).toBeHidden();
  });

  test("blog preview keeps the reader view without admin chrome", async ({ page }) => {
    await openAsAdmin(page, "/admin/blog/some-id/preview");
    await expect(page.getByRole("navigation", { name: "Admin sections" })).toHaveCount(0);
  });
});

test.describe("consigners", () => {
  test("assigns the Jetta to a signed-up owner and grants dashboard access", async ({ page }) => {
    const backend = await openAsAdmin(page);
    await expect(page.getByRole("heading", { name: "No consigners yet" })).toBeVisible();

    await page.getByRole("button", { name: "Assign vehicle" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Assign a vehicle" });

    // Required fields are checked before anything is sent.
    await dialog.getByRole("button", { name: "Assign vehicle" }).click();
    await expect(dialog.getByText("Choose the owner's account.")).toBeVisible();
    await expect(dialog.getByText("Choose a vehicle.")).toBeVisible();
    await expect(dialog.getByText("Enter a share from 0 to 100 (up to two decimals).")).toBeVisible();
    expect(backend.assignCalls).toHaveLength(0);

    // Unconfirmed accounts can't be picked.
    await dialog.getByRole("combobox", { name: "Owner's account" }).click();
    await expect(page.getByRole("option", { name: /Pending Person/ })).toHaveAttribute("aria-disabled", "true");
    await page.getByRole("option", { name: /Test Owner/ }).click();
    await expect(dialog.getByLabel("Legal name")).toHaveValue("Test Owner");

    await dialog.getByRole("combobox", { name: "Vehicle" }).click();
    await page.getByRole("option", { name: /2019 Volkswagen Jetta/ }).click();
    // The start date follows the car's in-service date.
    await expect(dialog.getByLabel("Share starts")).toHaveValue(JETTA.in_service_on);

    await dialog.getByLabel("Owner's share (%)").fill("150");
    await dialog.getByRole("button", { name: "Assign vehicle" }).click();
    await expect(dialog.getByText("Enter a share from 0 to 100 (up to two decimals).")).toBeVisible();

    await dialog.getByLabel("Owner's share (%)").fill("60");
    await expect(dialog.getByText("Rent With Heldy keeps 40%.")).toBeVisible();
    await dialog.getByRole("button", { name: "Assign vehicle" }).click();
    await expect(dialog).toBeHidden();

    expect(backend.assignCalls).toEqual([
      expect.objectContaining({
        p_user_id: OWNER_ACCOUNT.user_id,
        p_vehicle_id: JETTA.id,
        p_owner_percent: 60,
        p_effective_from: "2026-09-17",
        p_legal_name: "Test Owner",
      }),
    ]);

    const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Test Owner" }) });
    await expect(card.getByText("Dashboard access", { exact: true })).toBeVisible();
    await expect(card.getByText("2019 Volkswagen Jetta")).toBeVisible();
    await expect(card.getByText("Owner 60% · Rent With Heldy 40% · Since Sep 17, 2026")).toBeVisible();
    await expect(card.getByText("Current", { exact: true })).toBeVisible();
  });

  test("won't offer a vehicle that already has an owner", async ({ page }) => {
    await openAsAdmin(page);
    await assignJetta(page);
    await page.getByRole("button", { name: "Assign another vehicle" }).click();
    const dialog = page.getByRole("dialog", { name: "Assign a vehicle" });
    // Opened from the consigner, so their account is already chosen.
    await expect(dialog.getByLabel("Legal name")).toHaveValue("Test Owner");
    await dialog.getByRole("combobox", { name: "Vehicle" }).click();
    await expect(page.getByRole("option", { name: /Jetta.*assigned to Test Owner/ })).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByRole("option", { name: new RegExp(`${EQUINOX.year} ${EQUINOX.make} ${EQUINOX.model}`) })).not.toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  test("ends an assignment and removes, then restores, dashboard access", async ({ page }) => {
    const backend = await openAsAdmin(page);
    await assignJetta(page);

    await page.getByRole("button", { name: "End assignment" }).click();
    const endDialog = page.getByRole("dialog", { name: "End assignment" });
    await endDialog.getByLabel("Last day of the owner's share").fill("2026-12-31");
    await endDialog.getByRole("button", { name: "Save end date" }).click();
    await expect(endDialog).toBeHidden();
    await expect(page.getByText("Owner 60% · Rent With Heldy 40% · Sep 17, 2026 – Dec 31, 2026")).toBeVisible();
    expect(backend.consignments[0]).toMatchObject({ effective_to: "2026-12-31", status: "active" });

    await page.getByRole("button", { name: "Remove dashboard access" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Remove access" }).click();
    await expect(page.getByText("Access removed", { exact: true })).toBeVisible();
    expect(backend.consignerRoles.has(OWNER_ACCOUNT.user_id)).toBe(false);

    await page.getByRole("button", { name: "Restore dashboard access" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Restore access" }).click();
    await expect(page.getByText("Dashboard access", { exact: true })).toBeVisible();
    expect(backend.consignerRoles.has(OWNER_ACCOUNT.user_id)).toBe(true);
  });

  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "tablet", width: 820, height: 1180 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    test(`has a clean layout with a consigner on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openAsAdmin(page);
      await assignJetta(page);
      await expectCleanLayout(page, `consigners ${viewport.name}`);
      await page.getByRole("button", { name: "Assign another vehicle" }).click();
      await expectCleanLayout(page, `assign dialog ${viewport.name}`, '[role="dialog"]');
    });
  }
});
