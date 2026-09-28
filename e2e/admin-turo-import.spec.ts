import { expect, test, type Page, type Route } from "@playwright/test";
import { ConsignerBackend } from "./support/consigner-backend";
import { expectCleanLayout } from "./support/layout-audit";

// The page talks to /api/turo-import (a Vercel function); here it is answered
// with the same shapes the function returns.

const summary = {
  trips: 12,
  newTrips: 3,
  updatedTrips: 2,
  unchangedTrips: 7,
  byStatus: { completed: 8, in_progress: 1, booked: 2, cancelled_by_guest: 1, cancelled_by_host: 0 },
  earningsRows: { new: 3, updated: 1, unchanged: 4, removed: 0 },
  totals: { earningsCents: 184250, rentalRevenueCents: 152000, excludedCents: 28750, unclassifiedCents: 3500 },
  firstTripStart: "2026-09-17",
  lastTripStart: "2026-11-08",
  vehicles: [
    { vehicleId: "veh-jetta", name: "2019 Volkswagen Jetta (White)", trips: 10, completed: 7, earningsCents: 160000, rentalRevenueCents: 131000 },
    { vehicleId: "veh-equinox", name: "2020 Chevrolet Equinox (Black)", trips: 2, completed: 1, earningsCents: 24250, rentalRevenueCents: 21000 },
  ],
};

const okResult = (mode: "check" | "import") => ({
  mode,
  fileName: "trip_earnings_export_20260928.csv",
  problems: [],
  summary,
  extraColumns: ["Check-in odometer"],
  droppedColumns: ["Guest", "Pickup location"],
  ...(mode === "import" ? { runId: "run-1" } : {}),
});

const CSV = "Reservation ID,Vehicle id,VIN,Trip status,Trip start,Trip end,Total earnings\n1,2,3,Completed,2026-09-19 10:00,2026-09-22 10:00,$1.00\n";

async function open(page: Page, respond: (mode: "check" | "import") => { status?: number; body: unknown }) {
  const backend = new ConsignerBackend();
  await backend.install(page, { asAdmin: true });
  const calls: Array<{ mode: string; fileName: string; csv: string; auth: string }> = [];
  await page.route("**/api/turo-import", async (route: Route) => {
    const body = JSON.parse(route.request().postData() ?? "{}");
    calls.push({ mode: body.mode, fileName: body.fileName, csv: body.csv, auth: route.request().headers()["authorization"] ?? "" });
    const reply = respond(body.mode);
    await route.fulfill({ status: reply.status ?? 200, contentType: "application/json", body: JSON.stringify(reply.body) });
  });
  await page.goto("/admin/turo-import");
  return calls;
}

const upload = (page: Page, name = "trip_earnings_export_20260928.csv", text = CSV) =>
  page.getByLabel("Trip earnings export").setInputFiles({ name, mimeType: "text/csv", buffer: Buffer.from(text) });

test.describe("Turo import", () => {
  test("is in the admin sidebar", async ({ page }) => {
    const backend = new ConsignerBackend();
    await backend.install(page, { asAdmin: true });
    await page.goto("/admin/consigners");
    await page.getByRole("navigation", { name: "Admin sections" }).getByRole("link", { name: "Turo import" }).click();
    await expect(page).toHaveURL(/\/admin\/turo-import$/);
    await expect(page.getByRole("heading", { level: 1, name: "Turo import" })).toBeVisible();
    await expect(page.getByText(/No imports from this page yet/)).toBeVisible();
  });

  test("checks the file first, then imports on request", async ({ page }) => {
    const calls = await open(page, (mode) => ({ body: okResult(mode) }));
    await upload(page);

    await expect(page.getByRole("heading", { name: "Ready to import" })).toBeVisible();
    expect(calls.map((c) => c.mode)).toEqual(["check"]);
    expect(calls[0]).toMatchObject({ fileName: "trip_earnings_export_20260928.csv", csv: CSV });
    expect(calls[0].auth).toMatch(/^Bearer /);

    await expect(page.getByText("Starting Sep 17, 2026 – Nov 8, 2026")).toBeVisible();
    await expect(page.getByText("3 new · 2 updated · 7 unchanged")).toBeVisible();
    await expect(page.getByText("$1,842.50")).toBeVisible();
    await expect(page.getByText("$1,520.00")).toBeVisible();
    await expect(page.getByRole("cell", { name: "2019 Volkswagen Jetta (White)" })).toBeVisible();
    await expect(page.getByText("Not stored: Guest, Pickup location.")).toBeVisible();

    await page.getByRole("button", { name: "Import 12 trips" }).click();
    await expect(page.getByRole("heading", { name: "Import complete" })).toBeVisible();
    expect(calls.map((c) => c.mode)).toEqual(["check", "import"]);
    await expect(page.getByRole("button", { name: /Import 12 trips/ })).toHaveCount(0);
    await page.getByRole("button", { name: "Import another file" }).click();
    await expect(page.getByRole("heading", { name: "Import complete" })).toHaveCount(0);
  });

  test("lists problems and offers no import", async ({ page }) => {
    await open(page, (mode) => ({
      body: {
        ...okResult(mode),
        problems: [
          { message: "Turo vehicle 111 (Chevrolet Equinox 2020, VIN 2GNAXKEV0L6000000, 4 trips) isn't linked to a vehicle in our fleet. Add its Turo ID to the vehicle first." },
          { message: "The line items don't add up to Total earnings on reservation 77. Turo may have added a column." },
        ],
      },
    }));
    await upload(page);
    await expect(page.getByRole("heading", { name: "Fix these before importing" })).toBeVisible();
    await expect(page.getByText("Nothing was saved. The file has 2 problems:")).toBeVisible();
    await expect(page.getByText(/Turo vehicle 111/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Import / })).toHaveCount(0);
  });

  test("says when the file changes nothing", async ({ page }) => {
    await open(page, (mode) => ({
      body: {
        ...okResult(mode),
        summary: { ...summary, newTrips: 0, updatedTrips: 0, unchangedTrips: 12, earningsRows: { new: 0, updated: 0, unchanged: 8, removed: 0 } },
      },
    }));
    await upload(page);
    await expect(page.getByRole("button", { name: "Already up to date" })).toBeDisabled();
  });

  test("rejects files that aren't CSV without sending them", async ({ page }) => {
    const calls = await open(page, (mode) => ({ body: okResult(mode) }));
    await upload(page, "earnings.xlsx", "not a csv");
    await expect(page.getByText("Choose the trip earnings export from Turo. It's a .csv file.")).toBeVisible();
    expect(calls).toEqual([]);
  });

  test("reports a server failure", async ({ page }) => {
    await open(page, (mode) =>
      mode === "check"
        ? { body: okResult(mode) }
        : { status: 500, body: { error: "The import stopped partway. Nothing is double-counted: upload the same file again to finish it." } },
    );
    await upload(page);
    await page.getByRole("button", { name: "Import 12 trips" }).click();
    await expect(page.getByText("Import stopped", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ready to import" })).toBeVisible();
  });

  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "tablet", width: 820, height: 1180 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    test(`has a clean layout with results on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await open(page, (mode) => ({ body: okResult(mode) }));
      await expectCleanLayout(page, `turo import empty ${viewport.name}`);
      await upload(page);
      await expect(page.getByRole("heading", { name: "Ready to import" })).toBeVisible();
      await expectCleanLayout(page, `turo import results ${viewport.name}`);
    });
  }
});
