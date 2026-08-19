import { expect, test, type Page } from "@playwright/test";

const adminUser = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "admin@rentwithheldy.com",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00.000Z",
};

const vehicle = (year: number, make: string, model: string, vin: string) => ({
  year,
  make,
  model,
  vin,
  mileage: 42_000,
  licensePlate: "",
});

async function mockAdmin(page: Page) {
  await page.addInitScript(({ user }) => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3_600;
    localStorage.setItem("sb-example-auth-token", JSON.stringify({
      access_token: "playwright-admin-token",
      refresh_token: "playwright-refresh-token",
      token_type: "bearer",
      expires_in: 3_600,
      expires_at: expiresAt,
      user,
    }));
  }, { user: adminUser });

  await page.route("https://example.supabase.co/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/auth/v1/user") {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(adminUser) });
    }
    if (path === "/rest/v1/user_roles") {
      return route.fulfill({
        status: 200,
        headers: { "content-range": "0-0/*" },
        contentType: "application/json",
        body: JSON.stringify([{ role: "admin" }]),
      });
    }
    return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
  });

  await page.route("**/api/agreements", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ agreements: [
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        agreement_number: "RWH-VAN-2026-001",
        status: "sent",
        created_at: "2026-08-10T14:00:00.000Z",
        updated_at: "2026-08-11T14:00:00.000Z",
        sent_at: "2026-08-11T13:00:00.000Z",
        executed_at: null,
        template: { id: "template-1", name: "Vehicle Consignment & Rental Management Agreement" },
        version: { id: "version-1", agreement_data: { vehicles: [vehicle(2018, "Ford", "Transit 350", "1FBAX2CM3JKA25303")] } },
        signers: [{ fullName: "Gary Heldenmuth", role: "Vehicle Owner", status: "pending" }],
      },
      {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        agreement_number: "RWH-MGT-2026-002",
        status: "executed",
        created_at: "2026-07-02T14:00:00.000Z",
        updated_at: "2026-07-05T14:00:00.000Z",
        sent_at: "2026-07-03T13:00:00.000Z",
        executed_at: "2026-07-05T14:00:00.000Z",
        template: { id: "template-2", name: "Fleet Management Agreement" },
        version: { id: "version-2", agreement_data: { vehicles: [vehicle(2024, "Ford", "Transit 350 HD", "1FBVU4XG6RKA04970")] } },
        signers: [{ fullName: "Alex Owner", role: "Vehicle Owner", status: "signed" }],
      },
    ] }),
  }));
}

test("admin can search and filter the agreement index", async ({ page }) => {
  await mockAdmin(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/admin/agreements");

  await expect(page.getByRole("heading", { level: 2, name: "Agreements", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "RWH-VAN-2026-001" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "RWH-MGT-2026-002" })).toBeVisible();

  await page.getByLabel("Status").click();
  await page.getByRole("option", { name: "Awaiting signatures" }).click();
  await expect(page.getByRole("cell", { name: "RWH-VAN-2026-001" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "RWH-MGT-2026-002" })).toHaveCount(0);

  await page.getByLabel("Status").click();
  await page.getByRole("option", { name: "All statuses" }).click();
  await page.getByLabel("Agreement type").click();
  await page.getByRole("option", { name: "Fleet Management Agreement" }).click();
  await expect(page.getByRole("cell", { name: "RWH-MGT-2026-002" })).toBeVisible();

  await page.getByLabel("Agreement type").click();
  await page.getByRole("option", { name: "All agreement types" }).click();
  await page.getByLabel("Search").fill("1FBAX2CM3JKA25303");
  await expect(page.getByRole("cell", { name: "RWH-VAN-2026-001" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "RWH-MGT-2026-002" })).toHaveCount(0);
});
