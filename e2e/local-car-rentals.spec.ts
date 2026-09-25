import { expect, test } from "@playwright/test";

const PATH = "/local-car-rentals";
const CANONICAL = "https://rentwithheldy.com/local-car-rentals";

// Every route this page links to must be a real route (not the 404 page).
const EXPECTED_INTERNAL_LINKS = [
  "/book",
  "/fort-lauderdale-airport-car-rental",
  "/car-rental-miami",
  "/car-rental-fort-lauderdale",
  "/hotel-concierge-rentals",
  "/cruise-port-delivery",
  "/how-it-works",
  "/faq",
  "/contact",
];

type JsonLd = Record<string, unknown> & { "@type"?: string };

test.describe("/local-car-rentals", () => {
  test("renders SEO metadata, one H1 and valid JSON-LD that mirrors the visible FAQ", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("rwh.lang", "en"));
    await page.goto(PATH);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("A Local Alternative to the Big Rental Car Companies");

    await expect(page).toHaveTitle("Local Car Rental Fort Lauderdale & Miami | Rent With Heldy");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", CANONICAL);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", CANONICAL);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Local Car Rental in Fort Lauderdale & Miami | Rent With Heldy",
    );
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);

    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => nodes.map((n) => n.textContent ?? ""));
    const parsed = blocks.map((b) => JSON.parse(b) as JsonLd);
    const byType = (type: string) => parsed.filter((d) => d["@type"] === type);

    expect(byType("WebPage")).toHaveLength(1);
    expect(byType("Service")).toHaveLength(1);
    expect(byType("BreadcrumbList")).toHaveLength(1);
    expect(byType("FAQPage")).toHaveLength(1);
    // No rating markup on this page.
    expect(blocks.join("")).not.toContain("aggregateRating");

    const service = byType("Service")[0] as JsonLd & { areaServed: { name: string }[] };
    const areaNames = service.areaServed.map((a) => a.name);
    for (const place of ["Fort Lauderdale", "Miami", "Broward County", "Miami-Dade County", "PortMiami", "Port Everglades"]) {
      expect(areaNames).toContain(place);
    }

    // FAQPage JSON-LD must exactly match the visible questions and answers.
    const faq = byType("FAQPage")[0] as JsonLd & {
      mainEntity: { name: string; acceptedAnswer: { text: string } }[];
    };
    const faqSection = page.locator("section", {
      has: page.getByRole("heading", { level: 2, name: "Local Car Rental Questions, Answered." }),
    });
    const visible = await faqSection.locator("h3").evaluateAll((nodes) =>
      nodes.map((h) => ({
        q: h.textContent ?? "",
        a: h.nextElementSibling?.textContent ?? "",
      })),
    );
    expect(visible).toHaveLength(12);
    expect(faq.mainEntity.map((e) => ({ q: e.name, a: e.acceptedAnswer.text }))).toEqual(visible);
  });

  test("links only to existing routes and plan CTA reaches the trip form", async ({ page }) => {
    await page.goto(PATH);
    const hrefs = await page
      .locator("main a[href^='/']")
      .evaluateAll((nodes) => [...new Set(nodes.map((n) => n.getAttribute("href") ?? ""))]);
    for (const href of EXPECTED_INTERNAL_LINKS) expect(hrefs).toContain(href);

    for (const href of hrefs.filter((h) => h !== "/book")) {
      await page.goto(href);
      await expect(page.locator("main"), `${href} should render a page`).toBeVisible();
      await expect(page.getByText("Oops! Page not found"), `${href} should not 404`).toHaveCount(0);
    }

    await page.goto(PATH);
    await page.getByRole("link", { name: "Plan My Trip" }).first().click();
    await expect(page).toHaveURL(/#plan-my-trip$/);
    await expect(page.locator("#plan-my-trip form")).toBeInViewport();
  });

  test("key internal pages link back to /local-car-rentals", async ({ page }) => {
    for (const path of ["/car-rental-fort-lauderdale", "/car-rental-miami", "/fort-lauderdale-airport-car-rental", "/", "/faq"]) {
      await page.goto(path);
      await expect(page.locator(`a[href="${PATH}"]`).first(), path).toBeAttached();
    }
  });
});
