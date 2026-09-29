import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { BlogBackend, makePost } from "./support/blog-backend";
import { expectCleanLayout } from "./support/layout-audit";

// The "Places to Go" guide after content/blog/updates/2026-09-29-places-to-go-photos.sql:
// section emojis, 13 local photos with captions and credits, and no business byline.

const SQL = readFileSync(new URL("../content/blog/updates/2026-09-29-places-to-go-photos.sql", import.meta.url), "utf8");
const CONTENT = JSON.parse(/\$json\$([\s\S]*?)\$json\$/.exec(SQL)![1]);

async function open(page: Page, language?: string) {
  const backend = new BlogBackend();
  backend.posts.push(
    makePost({
      title: "Places to Go in Fort Lauderdale and Miami: A Local's Guide",
      slug: "places-to-go-fort-lauderdale-miami",
      excerpt: "Beaches, zoos, museums and the local restaurants we send our own friends to.",
      status: "published",
      published_at: "2026-09-28T23:44:09.994Z",
      category_id: "cat-sofla",
      featured_image: "/images/blog/fort-lauderdale-beach-promenade.jpg",
      featured_image_alt: "Fort Lauderdale beach at sunrise",
      featured_image_width: 1600,
      featured_image_height: 900,
      author: "Rent With Heldy",
      content: CONTENT,
    }),
  );
  if (language) await page.addInitScript((lang) => localStorage.setItem("rwh.lang", lang), language);
  await backend.install(page, { asAdmin: false });
  await page.goto("/blog/places-to-go-fort-lauderdale-miami");
  await expect(page.getByRole("heading", { level: 1, name: /Places to Go in Fort Lauderdale and Miami/ })).toBeVisible();
}

/** Scrolls every article image into view and waits for it to load. */
async function expectPhotosLoaded(page: Page) {
  const images = page.locator(".blog-prose img");
  await expect(images).toHaveCount(13);
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(image).not.toHaveAttribute("alt", "");
  }
}

test("the local guide has section emojis, captioned photos and credits, and no business byline", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);

  // The business isn't shown as an author.
  await expect(page.getByText(/By Rent With Heldy/)).toHaveCount(0);
  await expect(page.locator("article header time").first()).toHaveText("September 28, 2026");

  const toc = page.getByRole("navigation", { name: "In this article" });
  await expect(toc.getByRole("link")).toHaveText([
    "🏖️ Beaches",
    "🐊 Zoos, animals and the Everglades",
    "🎨 Museums and culture",
    "🍽️ Local restaurants and hangouts",
    "🚗 A few tips for getting around",
    "🌴 Let us handle the car",
  ]);
  // Anchor ids are unchanged by the emojis.
  await expect(toc.getByRole("link", { name: "🏖️ Beaches" })).toHaveAttribute("href", "#beaches");

  await expectPhotosLoaded(page);
  await expect(page.locator(".blog-gallery")).toHaveCount(3);
  await expect(page.locator("figure[data-layout='right']")).toHaveCount(4);
  await expect(page.getByRole("img", { name: /Giraffes at the Samburu feeding station/ }).locator("xpath=..")).toContainText("Photo: Jedi94.");

  // Every photo is credited with its source and license.
  const credits = page.locator("ul").filter({ hasText: "Hollywood Beach Broadwalk: Richard Mc Neil" });
  await expect(credits.getByRole("listitem")).toHaveCount(13);
  await expect(credits.getByRole("link", { name: "Richard Mc Neil" })).toHaveAttribute("href", "https://commons.wikimedia.org/w/index.php?curid=52905372");
  await expect(credits.getByRole("link", { name: "CC BY 3.0" }).first()).toHaveAttribute("href", "https://creativecommons.org/licenses/by/3.0/");
  await expect(credits.getByRole("link", { name: "Richard Mc Neil" })).toHaveAttribute("target", "_blank");
  await expectCleanLayout(page, "local guide desktop");
});

for (const language of ["en", "es", "fr", "pt", "he"]) {
  for (const viewport of [
    { name: "mobile", width: 390, height: 844 },
    { name: "tablet", width: 820, height: 1180 },
    { name: "desktop", width: 1440, height: 900 },
  ]) {
    test(`the local guide has a clean layout in ${language} on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await open(page, language);
      await expect(page.locator("html")).toHaveAttribute("dir", language === "he" ? "rtl" : "ltr");
      await expectPhotosLoaded(page);
      await expectCleanLayout(page, `local guide ${language} ${viewport.name}`);
    });
  }
}
