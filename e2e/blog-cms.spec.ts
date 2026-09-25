import { expect, test, type Page } from "@playwright/test";
import { BlogBackend, makePost, paragraph } from "./support/blog-backend";

const livePost = (overrides: Record<string, unknown> = {}) =>
  makePost({
    title: "Getting From FLL to Your Hotel",
    slug: "fll-to-your-hotel",
    excerpt: "A short guide to getting from the airport to your hotel.",
    status: "published",
    published_at: "2026-09-01T14:00:00.000Z",
    last_updated_at: "2026-09-10T14:00:00.000Z",
    category_id: "cat-airport",
    content: {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Arriving at FLL" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "See our " },
            { type: "text", text: "local car rentals", marks: [{ type: "link", attrs: { href: "/local-car-rentals" } }] },
            { type: "text", text: " and the " },
            { type: "text", text: "airport website", marks: [{ type: "link", attrs: { href: "https://www.broward.org/airport" } }] },
            { type: "text", text: "." },
          ],
        },
      ],
    },
    cta_label: "Browse Available Cars",
    cta_url: "/book",
    ...overrides,
  });

async function seedLive(backend: BlogBackend, overrides: Record<string, unknown> = {}) {
  const post = livePost(overrides);
  backend.posts.push(post);
  backend.sources.push({ id: "s1", post_id: post.id, position: 0, name: "FLL official site", url: "https://www.broward.org/airport", publisher: "Broward County" });
  return post;
}

const jsonLd = async (page: Page) =>
  (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t));

test.describe("public blog", () => {
  test("only live posts are listed; drafts and future scheduled posts stay hidden", async ({ page }) => {
    const backend = new BlogBackend();
    await seedLive(backend);
    backend.posts.push(makePost({ title: "Secret Draft", slug: "secret-draft", status: "draft" }));
    backend.posts.push(makePost({ title: "Future Post", slug: "future-post", status: "scheduled", published_at: "2099-01-01T00:00:00.000Z" }));
    backend.posts.push(makePost({ title: "Due Scheduled Post", slug: "due-post", status: "scheduled", published_at: "2026-01-02T00:00:00.000Z", category_id: "cat-guides" }));
    await backend.install(page, { asAdmin: false });

    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1, name: "Rent With Heldy Blog" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Getting From FLL to Your Hotel/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Due Scheduled Post/ })).toBeVisible();
    await expect(page.getByText("Secret Draft")).toHaveCount(0);
    await expect(page.getByText("Future Post")).toHaveCount(0);
    await expect(page).toHaveTitle("Car Rental Guides & South Florida Travel Blog | Rent With Heldy");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://rentwithheldy.com/blog");

    // Category filter only offers topics that have posts, and filters in place.
    const topics = page.getByRole("group", { name: "Browse by topic" });
    await expect(topics.getByRole("button")).toHaveText(["All topics", "Car Rental Guides", "Airport & Cruise Travel"]);
    await topics.getByRole("button", { name: "Car Rental Guides" }).click();
    await expect(page).toHaveURL(/category=car-rental-guides/);
    await expect(page.getByRole("link", { name: /Due Scheduled Post/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Getting From FLL/ })).toHaveCount(0);

    // Drafts are not reachable by URL either.
    await page.goto("/blog/secret-draft");
    await expect(page.getByRole("heading", { name: "We couldn't find that article." })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
  });

  test("article renders metadata, schema, sources, CTA and working links", async ({ page }) => {
    const backend = new BlogBackend();
    await seedLive(backend, { featured_image: "https://example.supabase.co/storage/v1/object/public/blog-images/fll.png", featured_image_alt: "SUV at FLL", featured_image_width: 1600, featured_image_height: 1000 });
    await backend.install(page, { asAdmin: false });

    await page.goto("/blog/fll-to-your-hotel");
    await expect(page.getByRole("heading", { level: 1, name: "Getting From FLL to Your Hotel" })).toBeVisible();
    await expect(page).toHaveTitle("Getting From FLL to Your Hotel | Rent With Heldy");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://rentwithheldy.com/blog/fll-to-your-hotel");
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /fll\.png$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /index, follow/);

    // Visible breadcrumb and BreadcrumbList agree.
    const crumbs = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(crumbs.getByRole("listitem")).toHaveText(["Blog", "Airport & Cruise Travel", "Getting From FLL to Your Hotel"]);
    const schemas = await jsonLd(page);
    const breadcrumb = schemas.find((s) => s["@type"] === "BreadcrumbList");
    expect(breadcrumb.itemListElement.map((i: { name: string }) => i.name)).toEqual(["Blog", "Airport & Cruise Travel", "Getting From FLL to Your Hotel"]);
    const article = schemas.find((s) => s["@type"] === "BlogPosting");
    expect(article).toMatchObject({ headline: "Getting From FLL to Your Hotel", datePublished: "2026-09-01T14:00:00.000Z", dateModified: "2026-09-10T14:00:00.000Z" });
    expect(JSON.stringify(article)).not.toMatch(/aggregateRating|review/i);

    // Visible dates match the schema dates.
    await expect(page.locator("time[datetime='2026-09-01T14:00:00.000Z']").first()).toHaveText("September 1, 2026");
    await expect(page.locator("time[datetime='2026-09-10T14:00:00.000Z']")).toHaveText("September 10, 2026");

    // Sources open safely in a new tab.
    const source = page.getByRole("region", { name: "Sources" }).getByRole("link", { name: /FLL official site/ });
    await expect(source).toHaveAttribute("href", "https://www.broward.org/airport");
    await expect(source).toHaveAttribute("target", "_blank");
    await expect(source).toHaveAttribute("rel", /noopener/);
    await expect(page.getByRole("link", { name: "airport website" })).toHaveAttribute("target", "_blank");

    // Featured image has alt text and dimensions.
    await expect(page.getByRole("img", { name: "SUV at FLL" })).toHaveAttribute("width", "1600");

    // CTA goes to the booking page; internal article links navigate in-app.
    await expect(page.getByRole("link", { name: "Browse Available Cars" }).last()).toHaveAttribute("href", "/book");
    await page.getByRole("link", { name: "local car rentals", exact: true }).click();
    await expect(page).toHaveURL(/\/local-car-rentals$/);
  });

  test("an old slug of a live post redirects to the new URL", async ({ page }) => {
    const backend = new BlogBackend();
    const post = await seedLive(backend);
    backend.redirects.push({ old_slug: "old-fll-guide", post_id: post.id });
    await backend.install(page, { asAdmin: false });
    await page.goto("/blog/old-fll-guide");
    await expect(page).toHaveURL(/\/blog\/fll-to-your-hotel$/);
    await expect(page.getByRole("heading", { level: 1, name: "Getting From FLL to Your Hotel" })).toBeVisible();
  });
});

test.describe("admin blog CMS", () => {
  test("create, preview, publish, update and unpublish a post", async ({ page }) => {
    const backend = new BlogBackend();
    await backend.install(page, { asAdmin: true });

    await page.goto("/admin/blog");
    await expect(page.getByRole("heading", { name: "Blog posts", exact: true })).toBeVisible();
    await expect(page.getByText("No blog posts yet")).toBeVisible();
    await page.getByRole("link", { name: "New Post" }).click();

    // Title generates the slug.
    await page.getByLabel("Title", { exact: true }).fill("Cruise Day: Getting to Port Everglades");
    await expect(page.getByLabel("Slug (web address)", { exact: true })).toHaveValue("cruise-day-getting-to-port-everglades");
    await page.getByLabel("Excerpt", { exact: true }).fill("How to plan the drive to your cruise.");

    // Rich text: heading, bold, internal link.
    const editor = page.getByRole("textbox", { name: "Article content" });
    await editor.click();
    await page.getByRole("button", { name: "Heading (H2)" }).click();
    await page.keyboard.type("Before you sail");
    await page.keyboard.press("Enter");
    await page.keyboard.type("Plan ahead and ");
    await page.getByRole("button", { name: "Add or edit link" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Cruise port rentals" }).click();
    await page.getByRole("button", { name: "Apply link" }).click();
    await expect(editor.getByRole("heading", { level: 2, name: "Before you sail" })).toBeVisible();
    await expect(editor.getByRole("link", { name: "Cruise port rentals" })).toBeVisible();

    // Category, tags, source, CTA, SEO.
    await page.getByLabel("Category", { exact: true }).click();
    await page.getByRole("option", { name: "Airport & Cruise Travel" }).click();
    await page.getByLabel("Tags", { exact: true }).fill("Port Everglades");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Add source" }).click();
    await page.getByLabel("Source name", { exact: true }).fill("Port Everglades");
    await page.getByLabel("URL", { exact: true }).fill("https://www.porteverglades.net");
    await page.getByLabel("Button", { exact: true }).click();
    await page.getByRole("option", { name: /Have a Car Delivered/ }).click();
    await expect(page.getByLabel("CTA URL", { exact: true })).toHaveValue("/local-car-rentals");
    await page.getByLabel("Meta description", { exact: true }).fill("x".repeat(200));
    await expect(page.getByText(/may be cut off in search results/)).toBeVisible();

    // Checklist reflects progress (featured image still missing).
    await expect(page.getByRole("listitem").filter({ hasText: /^Featured image/ })).toContainText("not yet");
    await expect(page.getByRole("listitem").filter({ hasText: /^Title/ })).toContainText("done");

    // Save draft — the long meta description does NOT block saving.
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByText("Draft saved").first()).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/blog\/[0-9a-f-]{36}$/);
    const saved = backend.posts[0];
    expect(saved).toMatchObject({ status: "draft", slug: "cruise-day-getting-to-port-everglades", category_id: "cat-airport", cta_url: "/local-car-rentals" });
    expect(backend.sources).toHaveLength(1);
    expect(backend.tags.map((t) => t.name)).toEqual(["Port Everglades"]);

    // Draft is not public.
    const visitor = await page.context().browser()!.newPage();
    await backend.install(visitor, { asAdmin: false });
    await visitor.goto("/blog/cruise-day-getting-to-port-everglades");
    await expect(visitor.getByRole("heading", { name: "We couldn't find that article." })).toBeVisible();

    // Live preview of unsaved state uses the public template.
    await page.getByLabel("Title", { exact: true }).fill("Cruise Day: Getting to Port Everglades Easily");
    // A saved post keeps its address when the title changes.
    await expect(page.getByLabel("Slug (web address)", { exact: true })).toHaveValue("cruise-day-getting-to-port-everglades");
    await page.getByRole("button", { name: "Preview" }).click();
    const preview = page.getByRole("dialog");
    await expect(preview.getByRole("heading", { level: 1, name: "Cruise Day: Getting to Port Everglades Easily" })).toBeVisible();
    await expect(preview.getByRole("region", { name: "Sources" })).toContainText("Port Everglades");
    await expect(preview.getByRole("link", { name: "Have a Car Delivered" })).toHaveAttribute("href", "/local-car-rentals");
    await page.keyboard.press("Escape");

    // Saved preview route (admin-only, noindex).
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByText("All changes saved")).toBeVisible();
    await page.goto(`/admin/blog/${saved.id}/preview`);
    await expect(page.getByRole("heading", { level: 1, name: /Port Everglades Easily/ })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,nofollow");
    // Admin screens omit the visitor "What brings you to Rent With Heldy?" strip.
    await expect(page.getByTestId("conversion-paths-footer")).toHaveCount(0);
    await page.getByRole("link", { name: "Edit" }).click();

    // Publish.
    await page.getByRole("button", { name: "Publish now" }).click();
    await expect(page.getByText("Post published").first()).toBeVisible();
    expect(backend.posts[0].status).toBe("published");
    expect(backend.posts[0].published_at).toBeTruthy();
    await visitor.goto("/blog/cruise-day-getting-to-port-everglades");
    await expect(visitor.getByRole("heading", { level: 1, name: /Port Everglades Easily/ })).toBeVisible();

    // Update a published post, including a slug change → redirect is kept.
    await page.getByLabel("Slug (web address)", { exact: true }).fill("port-everglades-cruise-day");
    await expect(page.getByText(/will permanently redirect/)).toBeVisible();
    await page.getByRole("button", { name: "Update", exact: true }).click();
    await expect(page.getByText("Published post updated").first()).toBeVisible();
    expect(backend.redirects).toEqual([{ old_slug: "cruise-day-getting-to-port-everglades", post_id: saved.id }]);
    await visitor.goto("/blog/cruise-day-getting-to-port-everglades");
    await expect(visitor).toHaveURL(/\/blog\/port-everglades-cruise-day$/);

    // Unpublish from the list, then delete with confirmation.
    await page.goto("/admin/blog");
    await expect(page.getByRole("row", { name: /Port Everglades Easily/ })).toContainText("Published");
    await page.getByRole("button", { name: /More actions for/ }).first().click();
    await page.getByRole("menuitem", { name: "Unpublish" }).click();
    await expect(page.getByText("Post unpublished").first()).toBeVisible();
    expect(backend.posts[0].status).toBe("draft");
    await visitor.goto("/blog/port-everglades-cruise-day");
    await expect(visitor.getByRole("heading", { name: "We couldn't find that article." })).toBeVisible();

    await page.getByRole("button", { name: /More actions for/ }).first().click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(page.getByRole("alertdialog")).toContainText("cannot be undone");
    await page.getByRole("button", { name: "Delete post" }).click();
    await expect(page.getByText("No blog posts yet")).toBeVisible();
    expect(backend.posts).toHaveLength(0);
    await visitor.close();
  });

  test("scheduling requires a future date and filters work", async ({ page }) => {
    const backend = new BlogBackend();
    backend.posts.push(makePost({ title: "Draft about tolls", slug: "tolls", status: "draft", category_id: "cat-sofla" }));
    await seedLive(backend);
    await backend.install(page, { asAdmin: true });

    await page.goto("/admin/blog");
    await page.getByLabel("Status", { exact: true }).click();
    await page.getByRole("option", { name: "Draft" }).click();
    await expect(page.getByRole("row", { name: /Draft about tolls/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Getting From FLL/ })).toHaveCount(0);
    await page.getByLabel("Search", { exact: true }).fill("nothing-matches");
    await expect(page.getByText("No posts match these filters")).toBeVisible();

    await page.goto(`/admin/blog/${backend.posts[0].id}`);
    await page.getByLabel("Status", { exact: true }).click();
    await page.getByRole("option", { name: /Scheduled/ }).click();
    await page.getByLabel("Publish date", { exact: true }).fill("2020-01-01T09:00");
    await page.getByRole("button", { name: "Schedule", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("must be in the future");
    await page.getByLabel("Publish date", { exact: true }).fill("2099-06-01T09:00");
    await page.getByRole("button", { name: "Schedule", exact: true }).click();
    await expect(page.getByText("Post scheduled").first()).toBeVisible();
    expect(backend.posts[0].status).toBe("scheduled");
    expect(backend.isLive(backend.posts[0])).toBe(false);
  });

  test("non-admins cannot open the blog admin", async ({ page }) => {
    const backend = new BlogBackend();
    await backend.install(page, { asAdmin: false });
    await page.goto("/admin/blog");
    await expect(page).toHaveURL(/\/auth$/);
  });
});
