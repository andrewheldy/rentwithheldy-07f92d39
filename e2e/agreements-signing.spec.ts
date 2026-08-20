import { expect, test, type Page } from "@playwright/test";

const token = "secure-test-token-that-is-long-and-unguessable-123456789";
const document = {
  schemaVersion: 1,
  title: "Vehicle Consignment & Rental Management Agreement",
  agreementNumber: "RWH-VAN-2026-001",
  agreementVersion: 1,
  effectiveDate: "2026-08-20",
  preamble: "This Vehicle Consignment & Rental Management Agreement is entered into between Heldy’s LLC d/b/a Rent With Heldy and the Vehicle Owner listed below.",
  operator: {
    legalName: "Heldy’s LLC",
    tradeName: "Rent With Heldy",
    address: "1 South Federal Highway\nDania Beach, Florida 33004",
    phone: "561-519-8958",
    email: "heldy@rentwithheldy.com",
    signer: { fullName: "Andrew Heldenmuth", email: "heldy@rentwithheldy.com", phone: "561-519-8958", role: "Rent With Heldy", required: true },
  },
  owners: [{ fullName: "Gary Heldenmuth", email: "GaryHH1@MSN.com", phone: "954-655-8107", role: "Vehicle Owner", required: true }],
  summary: {
    trialStartDate: "2026-08-20",
    trialReviewDate: "2026-11-20",
    operatorPercent: 70,
    ownerPercent: 30,
    vehicles: [
      { year: 2018, make: "Ford", model: "Transit 350 Passenger Van", vin: "1FBAX2CM3JKA25303", mileage: 115257, licensePlate: "" },
      { year: 2024, make: "Ford", model: "Transit 350 HD Passenger Van", vin: "1FBVU4XG6RKA04970", mileage: 33083, licensePlate: "" },
    ],
  },
  sections: [
    { number: 1, title: "Purpose", blocks: [{ type: "paragraph", text: "The Parties agree that this arrangement will begin as a three-month trial period." }] },
    { number: 2, title: "Vehicles", blocks: [{ type: "vehicles", vehicles: [
      { year: 2018, make: "Ford", model: "Transit 350 Passenger Van", vin: "1FBAX2CM3JKA25303", mileage: 115257, licensePlate: "" },
      { year: 2024, make: "Ford", model: "Transit 350 HD Passenger Van", vin: "1FBVU4XG6RKA04970", mileage: 33083, licensePlate: "" },
    ] }] },
    { number: 3, title: "Revenue Share", blocks: [{ type: "revenue_split", operatorPercent: 70, ownerPercent: 30 }] },
    { number: 4, title: "Payment", blocks: [{ type: "payment_schedule", cadence: "monthly" }] },
    { number: 5, title: "Trial", blocks: [{ type: "trial_period", startDate: "2026-08-20", reviewDate: "2026-11-20" }] },
    { number: 6, title: "Signatures", blocks: [{ type: "signatures", signers: [] }] },
  ],
};

const signatures = [
  { id: "andrew", name: "Andrew Heldenmuth", role: "Rent With Heldy", required: true, status: "pending", signedAt: null },
  { id: "gary", name: "Gary Heldenmuth", role: "Vehicle Owner", required: true, status: "pending", signedAt: null },
];

async function mockSigningApi(page: Page) {
  await page.route("**/api/signing", async (route) => {
    const body = route.request().postDataJSON();
    if (body.action === "sign") {
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          state: "executed",
          agreement: { agreementNumber: document.agreementNumber, title: document.title, version: 1, status: "executed", documentHash: "a".repeat(64), document, executedAt: "2026-08-20T16:00:00Z", downloadAvailable: true },
          signer: { id: "gary", name: "Gary Heldenmuth", role: "Vehicle Owner", status: "signed", signedAt: "2026-08-20T16:00:00Z" },
          signatures: signatures.map((signer) => ({ ...signer, status: "signed", signedAt: "2026-08-20T16:00:00Z", signatureMethod: "typed", typedSignature: signer.name })),
          downloadToken: "secure-download-token-that-is-separate-from-signing-123456789",
        }),
      });
    }
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        state: "signable",
        agreement: { agreementNumber: document.agreementNumber, title: document.title, version: 1, status: "sent", documentHash: "a".repeat(64), document, executedAt: null, downloadAvailable: false },
        signer: { id: "gary", name: "Gary Heldenmuth", role: "Vehicle Owner", status: "pending", signedAt: null },
        signatures,
      }),
    });
  });
}

test("mobile signer can review, draw, clear, and use the typed accessible signature", async ({ page }) => {
  await mockSigningApi(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/sign#${token}`);

  await expect(page.getByRole("heading", { name: document.title })).toBeVisible();
  await expect(page.getByText("RWH-VAN-2026-001", { exact: true })).toBeVisible();
  await expect(page.getByText("1FBAX2CM3JKA25303")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const canvas = page.getByLabel("Draw your signature");
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Signature canvas was not rendered");
  await page.mouse.move(box.x + 40, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(box.x + 150, box.y + 55, { steps: 8 });
  await page.mouse.up();
  const clear = page.getByRole("button", { name: "Clear signature" });
  await expect(clear).toBeEnabled();
  await clear.click();
  await expect(clear).toBeDisabled();

  await page.getByRole("tab", { name: "Type signature" }).click();
  await page.getByLabel("Confirm your full name").fill("Gary Heldenmuth");
  await page.getByLabel("Typed electronic signature").fill("Gary Heldenmuth");
  await page.getByText("I have reviewed this Agreement").click();
  await page.getByRole("button", { name: "Sign Agreement" }).click();
  await expect(page.getByRole("heading", { name: "Agreement complete" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download executed PDF" })).toBeVisible();
});

for (const width of [320, 390, 430]) {
  test(`signing document has no horizontal overflow at ${width}px`, async ({ page }) => {
    await mockSigningApi(page);
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/sign#${token}`);
    await expect(page.getByRole("heading", { name: document.title })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("signing controls are keyboard operable", async ({ page }) => {
  await mockSigningApi(page);
  await page.goto(`/sign#${token}`);

  const typedTab = page.getByRole("tab", { name: "Type signature" });
  await typedTab.focus();
  await page.keyboard.press("Enter");
  await expect(typedTab).toHaveAttribute("aria-selected", "true");
  await page.getByLabel("Confirm your full name").fill("Gary Heldenmuth");
  await page.getByLabel("Typed electronic signature").fill("Gary Heldenmuth");

  const consent = page.getByRole("checkbox");
  await consent.focus();
  await page.keyboard.press("Space");
  await expect(consent).toBeChecked();

  const submit = page.getByRole("button", { name: "Sign Agreement" });
  await submit.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Agreement complete" })).toBeVisible();
});
