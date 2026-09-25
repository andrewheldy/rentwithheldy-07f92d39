import { expect, test, type Page } from "@playwright/test";
import { BlogBackend, makePost, paragraph } from "./support/blog-backend";
import { expectCleanLayout } from "./support/layout-audit";

const locales = ["en", "es", "fr", "pt", "he"] as const;
const viewports = [
  ["390x844", { width: 390, height: 844 }],
  ["768x1024", { width: 768, height: 1024 }],
  ["1440x900", { width: 1440, height: 900 }],
] as const;

function seededBackend() {
  const backend = new BlogBackend();
  backend.posts.push(
    makePost({
      title: "A Longer Article Title About Getting From Fort Lauderdale Airport to Your Hotel Without the Rental Counter",
      slug: "fll-to-hotel",
      excerpt: "Everything to know about getting from the airport to your hotel, from where to meet us to what to have ready when you land.",
      status: "published",
      published_at: "2026-09-01T14:00:00.000Z",
      category_id: "cat-airport",
      cta_label: "Have a Car Delivered",
      cta_url: "/local-car-rentals",
      content: {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Arriving at FLL" }] },
          paragraph("A paragraph of article text that should wrap cleanly on small screens without overflowing its column."),
          {
            type: "table",
            content: [
              { type: "tableRow", content: ["Topic", "Rental counter", "Rent With Heldy"].map((t) => ({ type: "tableHeader", content: [paragraph(t)] })) },
              { type: "tableRow", content: ["Pickup", "Shuttle to a rental facility", "Coordinated with you"].map((t) => ({ type: "tableCell", content: [paragraph(t)] })) },
            ],
          },
        ],
      },
    }),
    makePost({ title: "Tolls in South Florida", slug: "tolls", excerpt: "How tolls work.", status: "published", published_at: "2026-08-20T14:00:00.000Z", category_id: "cat-sofla" }),
  );
  backend.sources.push({ id: "s1", post_id: backend.posts[0].id, position: 0, name: "Fort Lauderdale-Hollywood International Airport", url: "https://www.broward.org/airport", publisher: "Broward County" });
  return backend;
}

const headerNav = (page: Page) => page.locator("header").first();

test.describe("About in the primary navigation (Blog stays out of the header)", () => {
  test("desktop header links to About and not to Blog", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const header = headerNav(page);
    await expect(header.getByRole("link", { name: "About", exact: true })).toHaveAttribute("href", "/about");
    await expect(header.getByRole("link", { name: /^Blog$/ })).toHaveCount(0);
    await header.getByRole("link", { name: "About", exact: true }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(header.getByRole("link", { name: "About", exact: true })).toHaveClass(/text-primary/);
  });

  for (const [name, viewport] of [["mobile", { width: 390, height: 844 }], ["tablet", { width: 768, height: 1024 }]] as const) {
    test(`${name} menu includes About and not Blog`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await page.getByRole("button", { name: "Open menu" }).click();
      const drawer = page.getByRole("dialog");
      await expect(drawer.getByRole("link", { name: "About", exact: true })).toHaveAttribute("href", "/about");
      await expect(drawer.getByRole("link", { name: /^Blog$/ })).toHaveCount(0);
      await drawer.getByRole("link", { name: "About", exact: true }).click();
      await expect(page).toHaveURL(/\/about$/);
      await expect(page.getByRole("heading", { level: 1, name: "Car Rental With a Little More Hospitality." })).toBeVisible();
    });
  }

  test("footer lists About and Blog", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "About", exact: true })).toHaveAttribute("href", "/about");
    await expect(footer.getByRole("link", { name: "Blog", exact: true })).toHaveAttribute("href", "/blog");
  });
});

test.describe("About page", () => {
  test("tells the story, links prominently to the blog, and has a booking CTA", async ({ page }) => {
    const backend = seededBackend();
    await backend.install(page, { asAdmin: false });
    await page.goto("/about");

    await expect(page).toHaveTitle("About Rent With Heldy | Local South Florida Car Rental");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://rentwithheldy.com/about");
    await expect(page.getByText("About Rent With Heldy", { exact: true })).toBeVisible();
    await expect(page.getByText("Customers are guests, not reservation numbers.")).toBeVisible();
    await expect(page.getByText("Be Our Guest.", { exact: true })).toBeVisible();

    const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t));
    const types = schemas.map((s) => s["@type"]);
    expect(types).toContain("AboutPage");
    expect(types).toContain("BreadcrumbList");
    // Site-wide Organization/LocalBusiness schema is not duplicated on this page.
    expect(types.filter((t) => t === "AutoRental")).toHaveLength(0);
    expect(types.filter((t) => t === "Organization")).toHaveLength(1); // the one in index.html

    // The blog section shows the latest live posts and leads to /blog.
    const blogSection = page.getByRole("region", { name: "More Than Just the Keys" });
    await expect(blogSection.getByRole("link", { name: /A Longer Article Title/ })).toHaveAttribute("href", "/blog/fll-to-hotel");
    await expect(page.getByRole("link", { name: "Browse Available Cars" }).first()).toHaveAttribute("href", "/book");
    await blogSection.getByRole("link", { name: "Read the Blog" }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole("heading", { level: 1, name: "Rent With Heldy Blog" })).toBeVisible();

    // Every internal link on About resolves to a real page (no 404 view).
    await page.goto("/about");
    const hrefs = await page.locator("main a[href^='/']").evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute("href")!))]);
    for (const href of hrefs) {
      await page.goto(href);
      await expect(page.getByText("Oops! Page not found")).toHaveCount(0);
      await expect(page.getByText("We couldn't find that article.")).toHaveCount(0);
    }
  });
});

for (const [viewportName, viewport] of viewports) {
  for (const locale of locales) {
    test(`${viewportName} ${locale}: About, Blog and article layouts are clean`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.addInitScript((language) => localStorage.setItem("rwh.lang", language), locale);
      const backend = seededBackend();
      await backend.install(page, { asAdmin: false });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));

      for (const path of ["/about", "/blog", "/blog/fll-to-hotel"]) {
        await page.goto(path, { waitUntil: "domcontentloaded" });
        await expect(page.locator("main")).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("dir", locale === "he" ? "rtl" : "ltr");
        if (path === "/blog/fll-to-hotel") {
          await expect(page.getByRole("heading", { level: 1 })).toContainText("A Longer Article Title");
          // English article body stays LTR inside RTL pages; non-English readers get a notice.
          await expect(page.locator("main div[lang='en'][dir='ltr'] .blog-prose")).toBeVisible();
          await expect(page.getByRole("note")).toHaveCount(locale === "en" ? 0 : 1);
        } else if (path === "/blog") {
          await expect(page.getByRole("link", { name: /A Longer Article Title/ })).toBeVisible();
        }
        await page.waitForTimeout(700); // let scroll reveals settle
        await expectCleanLayout(page, `${viewportName}/${locale}${path}`);
      }
      expect(errors).toEqual([]);
    });
  }
}
