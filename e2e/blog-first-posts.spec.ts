import { expect, test } from "@playwright/test";
import { loadPosts, slugifyTag } from "../scripts/blog-posts.mjs";
import { BlogBackend, CATEGORIES, makePost } from "./support/blog-backend";
import { expectCleanLayout } from "./support/layout-audit";

// Renders the Markdown posts in content/blog/ through the real article page
// (Supabase mocked) to check layout, links, sources and CTA before they are
// loaded into the CMS.

const posts = loadPosts();

function seed(backend: BlogBackend) {
  posts.forEach((post, i) => {
    const row = makePost({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category_id: CATEGORIES.find((c) => c.slug === post.category)?.id ?? null,
      status: "published",
      published_at: `2026-09-2${i + 1}T14:00:00.000Z`,
      seo_title: post.seo_title,
      meta_description: post.meta_description,
      primary_keyword: post.primary_keyword,
      cta_label: post.cta_label,
      cta_url: post.cta_url,
    });
    backend.posts.push(row);
    post.tags.forEach((name: string) => {
      const slug = slugifyTag(name);
      let tag = backend.tags.find((t) => t.slug === slug);
      if (!tag) backend.tags.push((tag = { id: `tag-${slug}`, slug, name }));
      backend.postTags.push({ post_id: row.id, tag_id: tag.id });
    });
    post.sources.forEach((s: { name: string; url: string; publisher: string | null }, position: number) =>
      backend.sources.push({ id: `${row.id}-s${position}`, post_id: row.id, position, ...s }),
    );
  });
}

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "desktop", width: 1280, height: 900 },
  { name: "wide", width: 1440, height: 900 },
];

test("the blog index lists every post", async ({ page }) => {
  const backend = new BlogBackend();
  seed(backend);
  await backend.install(page, { asAdmin: false });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/blog");
  for (const post of posts) await expect(page.getByRole("link", { name: new RegExp(post.title.slice(0, 30)) })).toBeVisible();
  await expectCleanLayout(page, "blog index", "main");
});

for (const post of posts) {
  test(`${post.slug} renders cleanly with working links`, async ({ page }) => {
    const backend = new BlogBackend();
    seed(backend);
    await backend.install(page, { asAdmin: false });

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`/blog/${post.slug}`);
      await expect(page.getByRole("heading", { level: 1, name: post.title })).toBeVisible();
      await expectCleanLayout(page, `${post.slug} @ ${vp.name}`, "main");
    }

    const article = page.locator(".blog-prose");
    const headings = post.content.content.filter((n: { type: string }) => n.type === "heading").length;
    await expect(article.locator("h2, h3")).toHaveCount(headings);
    for (const s of post.sources) await expect(page.getByRole("link", { name: new RegExp(s.name.slice(0, 25).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).first()).toBeVisible();
    if (post.cta_url) await expect(page.locator(`main a[href="${post.cta_url}"]`).first()).toBeVisible();

    // Internal links navigate inside the app to a real page (not the 404).
    const internal = await article.locator('a[href^="/"]').evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href")))]);
    expect(internal.length).toBeGreaterThan(0);
    for (const href of internal) {
      await page.goto(`/blog/${post.slug}`);
      const link = page.locator(`.blog-prose a[href="${href}"]`).first();
      if (href === "/book") {
        // /book hands off to the external Wheelbase store.
        const handoff = page.waitForRequest((r) => r.isNavigationRequest() && r.url().includes("wheelbase"));
        await link.click();
        await handoff;
        continue;
      }
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${href}$`));
      await expect(page.getByText("Oops! Page not found")).toHaveCount(0);
    }
    const external = article.locator('a[href^="http"]');
    for (const link of await external.all()) {
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener/);
    }
  });
}

test("posts keep the English body readable inside RTL Hebrew chrome", async ({ page }) => {
  const backend = new BlogBackend();
  seed(backend);
  await backend.install(page, { asAdmin: false });
  await page.addInitScript(() => localStorage.setItem("rwh.lang", "he"));
  for (const vp of [VIEWPORTS[0], VIEWPORTS[3], VIEWPORTS[4]]) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const post of posts) {
      await page.goto(`/blog/${post.slug}`);
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
      await expect(page.locator(".blog-prose").locator("xpath=ancestor-or-self::*[@lang='en'][1]")).toHaveAttribute("dir", "ltr");
      await expectCleanLayout(page, `${post.slug} he @ ${vp.name}`, "main");
    }
  }
});
