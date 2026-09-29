import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { BlogBackend, SUPABASE, makePost, paragraph } from "./support/blog-backend";
import { expectCleanLayout } from "./support/layout-audit";

// Blog upgrades: article header layouts, focal point, photo caption/credit,
// table of contents, in-article blocks (image layouts, gallery, callout,
// button), share links, author profiles and the authors admin.

const IMAGE = (name: string) => `${SUPABASE}/storage/v1/object/public/blog-images/${name}.png`;
const ARTICLE_URL = "https://rentwithheldy.com/blog/cruise-day-guide";
const heading = (text: string) => ({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] });
const locale = (language: string) =>
  JSON.parse(readFileSync(new URL(`../src/i18n/locales/${language}/blog.json`, import.meta.url), "utf8")) as {
    article: { toc: string; aboutAuthor: string; photoCredit: string; share: { heading: string }; ctaPresets: { browse: string } };
  };

// 1x1 PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const png = (name: string) => ({ name: `${name}.png`, mimeType: "image/png", buffer: PNG });

const TEAM = {
  id: "author-team",
  slug: "heldy-team",
  name: "Heldy Team",
  role: "Founders, Rent With Heldy",
  bio: "A family team delivering rental cars across South Florida.",
  photo_url: null,
};

function seedArticle(backend: BlogBackend, overrides: Record<string, unknown> = {}) {
  backend.authors.push({ ...TEAM });
  const post = makePost({
    title: "A Cruise Day Guide to Port Everglades",
    slug: "cruise-day-guide",
    excerpt: "Everything you need for a calm drive to the ship.",
    status: "published",
    published_at: "2026-09-01T14:00:00.000Z",
    category_id: "cat-airport",
    header_layout: "overlay",
    featured_image: IMAGE("port"),
    featured_image_alt: "Cruise ship at Port Everglades",
    featured_image_width: 1600,
    featured_image_height: 900,
    featured_image_caption: "Terminal 25 at sunrise.",
    featured_image_credit: "Jordan Lee",
    featured_image_focus_x: 30,
    featured_image_focus_y: 70,
    author: "Heldy Team",
    author_id: TEAM.id,
    content: {
      type: "doc",
      content: [
        heading("Before you leave home"),
        paragraph("Check your sailing time and leave early."),
        { type: "callout", attrs: { tone: "tip" }, content: [paragraph("Pack light for the drive.")] },
        heading("Getting to the port"),
        { type: "image", attrs: { src: IMAGE("gate"), alt: "Port entrance gate", title: "The main gate.", layout: "right" } },
        paragraph("Follow the signs for your terminal. ".repeat(12)),
        {
          type: "gallery",
          attrs: {
            caption: "Parking and drop-off.",
            images: [
              { src: IMAGE("g1"), alt: "Drop-off lane" },
              { src: IMAGE("g2"), alt: "Parking garage" },
            ],
          },
        },
        heading("Returning the car"),
        { type: "ctaButton", attrs: { label: "Browse Available Cars", href: "/book" } },
        paragraph("We meet you at the terminal when you're back."),
      ],
    },
    ...overrides,
  });
  backend.posts.push(post);
  return post;
}

async function openArticle(page: Page, language?: string) {
  const backend = new BlogBackend();
  seedArticle(backend);
  if (language) await page.addInitScript((lang) => localStorage.setItem("rwh.lang", lang), language);
  await backend.install(page, { asAdmin: false });
  await page.goto("/blog/cruise-day-guide");
  await expect(page.getByRole("heading", { level: 1, name: "A Cruise Day Guide to Port Everglades" })).toBeVisible();
  return backend;
}

test.describe("article reader features", () => {
  test("overlay header, contents, blocks, sharing and author card", async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openArticle(page);

    // Header photo keeps its focal point; caption and credit sit under it.
    const hero = page.getByRole("img", { name: "Cruise ship at Port Everglades" });
    await expect(hero).toHaveCSS("object-position", "30% 70%");
    await expect(page.getByText("Terminal 25 at sunrise.")).toBeVisible();
    await expect(page.getByText("Photo: Jordan Lee")).toBeVisible();
    await expect(page.locator("header").getByText("By Heldy Team")).toBeVisible();

    // Table of contents lists the sections and jumps to them.
    const toc = page.getByRole("navigation", { name: "In this article" });
    await expect(toc.getByRole("link")).toHaveText(["Before you leave home", "Getting to the port", "Returning the car"]);
    await toc.getByRole("link", { name: "Returning the car" }).click();
    await expect(page).toHaveURL(/#returning-the-car$/);
    await expect(page.getByRole("heading", { level: 2, name: "Returning the car" })).toBeInViewport();

    // In-article blocks.
    const callout = page.getByRole("note").filter({ hasText: "Pack light for the drive." });
    await expect(callout).toHaveAttribute("data-tone", "tip");
    const beside = page.locator("figure").filter({ has: page.getByRole("img", { name: "Port entrance gate" }) });
    await expect(beside).toHaveAttribute("data-layout", "right");
    await expect(beside).toHaveCSS("float", "right");
    await expect(beside).toContainText("The main gate.");
    const gallery = page.locator(".blog-gallery");
    await expect(gallery.getByRole("img")).toHaveCount(2);
    await expect(gallery).toContainText("Parking and drop-off.");
    await expect(page.locator(".blog-inline-cta").getByRole("link", { name: "Browse Available Cars" })).toHaveAttribute("href", "/book");

    // Share links point at the article's public address.
    const share = page.getByRole("region", { name: "Share this article" });
    const encoded = encodeURIComponent(ARTICLE_URL);
    await expect(share.getByRole("link", { name: "Share on Facebook" })).toHaveAttribute("href", `https://www.facebook.com/sharer/sharer.php?u=${encoded}`);
    await expect(share.getByRole("link", { name: "Share on X" })).toHaveAttribute("href", new RegExp(`^https://x\\.com/intent/post\\?url=${encoded.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    await expect(share.getByRole("link", { name: "Share on LinkedIn" })).toHaveAttribute("href", `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`);
    await expect(share.getByRole("link", { name: "Share on WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/\?text=/);
    await expect(share.getByRole("link", { name: "Share on Facebook" })).toHaveAttribute("target", "_blank");
    await expect(share.getByRole("link", { name: "Share by email" })).toHaveAttribute("href", `mailto:?subject=${encodeURIComponent("A Cruise Day Guide to Port Everglades")}&body=${encoded}`);
    await share.getByRole("button", { name: "Copy link" }).click();
    await expect(share.getByRole("button", { name: "Link copied" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(ARTICLE_URL);

    // Author card from the linked profile.
    const author = page.getByRole("region", { name: "About the author" });
    await expect(author).toContainText("Heldy Team");
    await expect(author).toContainText("Founders, Rent With Heldy");
    await expect(author).toContainText("A family team delivering rental cars across South Florida.");

    await expectCleanLayout(page, "article desktop");
  });

  test("the stacked and title-only headers, and no contents for short articles", async ({ page }) => {
    const backend = new BlogBackend();
    seedArticle(backend, {
      header_layout: "stacked",
      author_id: null,
      content: { type: "doc", content: [heading("Only one section"), paragraph("Short.")] },
    });
    backend.posts.push(
      makePost({
        title: "No Photo Here",
        slug: "no-photo",
        status: "published",
        published_at: "2026-09-02T14:00:00.000Z",
        header_layout: "overlay",
      }),
    );
    await backend.install(page, { asAdmin: false });
    await page.goto("/blog/cruise-day-guide");
    const figure = page.locator("header figure");
    await expect(figure.getByRole("img", { name: "Cruise ship at Port Everglades" })).toHaveCSS("object-position", "30% 70%");
    await expect(figure.locator("figcaption")).toHaveText("Terminal 25 at sunrise. Photo: Jordan Lee");
    await expect(page.getByRole("navigation", { name: "In this article" })).toHaveCount(0);
    // No linked profile: the byline stays, without a card.
    await expect(page.getByRole("region", { name: "About the author" })).toHaveCount(0);

    // "Photo behind the title" without a photo falls back to the title alone.
    await page.goto("/blog/no-photo");
    await expect(page.getByRole("heading", { level: 1, name: "No Photo Here" })).toBeVisible();
    await expect(page.locator("article header img")).toHaveCount(0);

    // Blog cards crop around the focal point too.
    await page.goto("/blog");
    await expect(page.getByRole("img", { name: "Cruise ship at Port Everglades" })).toHaveCSS("object-position", "30% 70%");
  });

  for (const language of ["en", "es", "fr", "pt", "he"]) {
    for (const viewport of [
      { name: "mobile", width: 390, height: 844 },
      { name: "tablet", width: 820, height: 1180 },
      { name: "desktop", width: 1440, height: 900 },
    ]) {
      test(`has a clean article layout in ${language} on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await openArticle(page, language);
        const strings = locale(language);
        await expect(page.locator("html")).toHaveAttribute("dir", language === "he" ? "rtl" : "ltr");
        await expect(page.getByRole("navigation", { name: strings.article.toc })).toBeVisible();
        await expect(page.getByRole("region", { name: strings.article.share.heading })).toBeVisible();
        await expect(page.getByRole("region", { name: strings.article.aboutAuthor })).toBeVisible();
        await expect(page.getByText(`${strings.article.photoCredit} Jordan Lee`)).toBeVisible();
        // Preset button labels are translated; the article itself stays English, left to right.
        await expect(page.locator(".blog-inline-cta").getByRole("link")).toHaveText(strings.article.ctaPresets.browse);
        await expect(page.locator("div[lang='en'][dir='ltr']").filter({ has: page.locator(".blog-prose") })).toHaveCount(1);
        await expectCleanLayout(page, `article ${language} ${viewport.name}`);
      });
    }
  }
});

test.describe("editor upgrades", () => {
  test("sets the header, focal point, caption, author and article blocks", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const backend = new BlogBackend();
    backend.authors.push({ ...TEAM });
    await backend.install(page, { asAdmin: true });
    await page.goto("/admin/blog/new");

    await page.getByLabel("Title", { exact: true }).fill("Port Day Checklist");
    await page.getByLabel("Excerpt", { exact: true }).fill("What to know before the drive.");

    // Callout, switched to a warning.
    const editor = page.getByRole("textbox", { name: "Article content" });
    await editor.click();
    await page.keyboard.type("Terminals change often.");
    await page.keyboard.press("Enter");
    await page.keyboard.type("More text.");
    await page.keyboard.press("ArrowUp");
    await page.getByRole("button", { name: "Callout box" }).click();
    await expect(editor.locator(".blog-callout")).toHaveAttribute("data-tone", "tip");
    await page.getByRole("button", { name: "Warning", exact: true }).click();
    await expect(editor.locator(".blog-callout")).toHaveAttribute("data-tone", "warning");
    await page.getByRole("button", { name: "Remove callout" }).click();
    await expect(editor.locator(".blog-callout")).toHaveCount(0);
    await page.getByRole("button", { name: "Callout box" }).click();
    await page.getByRole("button", { name: "Warning", exact: true }).click();

    await expect(editor.locator(".blog-callout")).not.toContainText("More text.");
    // New blocks go after the last paragraph.
    const atEnd = async () => {
      await editor.getByText("More text.").click();
      await page.keyboard.press("End");
    };

    // A button (preset).
    await atEnd();
    await page.getByRole("button", { name: "Add button" }).click();
    const buttonDialog = page.getByRole("dialog", { name: "Add a button" });
    await buttonDialog.getByLabel("Button link").fill("javascript:alert(1)");
    await buttonDialog.getByRole("button", { name: "Insert button" }).click();
    await expect(buttonDialog.getByRole("alert")).toContainText("page on this site");
    await buttonDialog.getByLabel("Button", { exact: true }).click();
    await page.getByRole("option", { name: /Browse Available Cars/ }).click();
    await buttonDialog.getByRole("button", { name: "Insert button" }).click();
    await expect(editor.locator('[data-type="cta-button"]')).toContainText("Browse Available Cars");

    // A two-photo gallery; every photo needs alt text.
    await atEnd();
    await page.getByRole("button", { name: "Add photo gallery" }).click();
    const galleryDialog = page.getByRole("dialog", { name: "Add a photo gallery" });
    await galleryDialog.locator('input[type="file"]').setInputFiles([png("one"), png("two")]);
    await expect(galleryDialog.getByLabel("Photo 2 alt text")).toBeVisible();
    await galleryDialog.getByLabel("Photo 1 alt text").fill("Drop-off lane");
    await galleryDialog.getByRole("button", { name: "Insert gallery" }).click();
    await expect(galleryDialog.getByRole("alert")).toContainText("Describe photo 2");
    await galleryDialog.getByLabel("Photo 2 alt text").fill("Parking garage");
    await galleryDialog.getByLabel("Caption (optional)").fill("Parking and drop-off.");
    await galleryDialog.getByRole("button", { name: "Insert gallery" }).click();
    await expect(editor.locator(".blog-gallery img")).toHaveCount(2);
    await expect(editor.locator('[data-type="cta-button"]')).toHaveCount(1);

    // An image set beside the text.
    await atEnd();
    await page.getByRole("button", { name: "Add image" }).click();
    const imageDialog = page.getByRole("dialog", { name: "Add an image" });
    await imageDialog.locator('input[type="file"]').setInputFiles(png("gate"));
    await imageDialog.getByLabel("Alt text (required)").fill("Port entrance gate");
    await imageDialog.getByRole("button", { name: "Insert image" }).click();
    await editor.getByRole("img", { name: "Port entrance gate" }).click();
    await page.getByRole("button", { name: "Left, text beside" }).click();
    await expect(editor.getByRole("img", { name: "Port entrance gate" })).toHaveAttribute("data-layout", "left");
    await page.getByRole("button", { name: "Alt text & caption" }).click();
    const editImage = page.getByRole("dialog", { name: "Edit image" });
    await expect(editImage.getByLabel("Alt text (required)")).toHaveValue("Port entrance gate");
    await editImage.getByLabel("Caption (optional)").fill("The main gate.");
    await editImage.getByRole("button", { name: "Save image" }).click();
    await expect(editor.getByRole("img", { name: "Port entrance gate" })).toHaveAttribute("title", "The main gate.");
    await expect(editor.getByRole("img", { name: "Port entrance gate" })).toHaveAttribute("data-layout", "left");

    // Featured image: upload, pick the focal point, caption and credit.
    const sidebar = page.locator("aside").filter({ hasText: "Featured image" });
    await sidebar.locator('input[type="file"]').setInputFiles(png("port"));
    const focal = page.getByRole("button", { name: /^Focal point/ });
    await expect(focal).toBeVisible();
    await expect(focal.locator("img")).toHaveJSProperty("complete", true);
    const box = (await focal.boundingBox())!;
    await focal.click({ position: { x: box.width * 0.25, y: box.height * 0.75 } });
    await expect(focal).toHaveAccessibleName(/25% from the left, 75% from the top/);
    await focal.press("ArrowRight");
    await expect(focal).toHaveAccessibleName(/30% from the left, 75% from the top/);
    await page.getByLabel("Image alt text").fill("Cruise ship at Port Everglades");
    await page.getByLabel("Caption (optional)").fill("Terminal 25 at sunrise.");
    await page.getByLabel("Photo credit (optional)").fill("Jordan Lee");
    await page.getByRole("radio", { name: "Photo behind the title" }).check();

    // Author profile sets the byline.
    await page.getByLabel("Author", { exact: true }).click();
    await page.getByRole("option", { name: /Heldy Team/ }).click();
    await expect(page.getByLabel("Author name")).toHaveCount(0);

    // The preview shows everything with the public template.
    await page.getByRole("button", { name: "Preview" }).click();
    const preview = page.getByRole("dialog");
    await expect(preview.getByRole("heading", { level: 1, name: "Port Day Checklist" })).toBeVisible();
    await expect(preview.getByRole("img", { name: "Cruise ship at Port Everglades" })).toHaveCSS("object-position", "30% 75%");
    await expect(preview.getByText("Photo: Jordan Lee")).toBeVisible();
    await expect(preview.getByRole("note").filter({ hasText: "Terminals change often." })).toHaveAttribute("data-tone", "warning");
    await expect(preview.locator(".blog-gallery img")).toHaveCount(2);
    await expect(preview.locator("figure[data-layout='left']")).toContainText("The main gate.");
    await expect(preview.locator(".blog-inline-cta").getByRole("link")).toHaveAttribute("href", "/book");
    await expect(preview.getByRole("region", { name: "About the author" })).toContainText("Founders, Rent With Heldy");
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByText("Draft saved").first()).toBeVisible();
    const saved = backend.posts[0];
    expect(saved).toMatchObject({
      header_layout: "overlay",
      featured_image_caption: "Terminal 25 at sunrise.",
      featured_image_credit: "Jordan Lee",
      featured_image_focus_x: 30,
      featured_image_focus_y: 75,
      author_id: TEAM.id,
      author: "Heldy Team",
    });
    const blocks = (saved.content as { content: { type: string; attrs?: Record<string, unknown> }[] }).content;
    expect(blocks.find((b) => b.type === "callout")?.attrs).toEqual({ tone: "warning" });
    expect(blocks.find((b) => b.type === "ctaButton")?.attrs).toEqual({ label: "Browse Available Cars", href: "/book" });
    expect((blocks.find((b) => b.type === "gallery")?.attrs?.images as unknown[]).length).toBe(2);
    expect(blocks.find((b) => b.type === "image")?.attrs).toMatchObject({ alt: "Port entrance gate", title: "The main gate.", layout: "left" });

    // Reopening the post restores every setting.
    await page.reload();
    await expect(page.getByRole("radio", { name: "Photo behind the title" })).toBeChecked();
    await expect(page.getByLabel("Photo credit (optional)")).toHaveValue("Jordan Lee");
    await expect(page.getByLabel("Author", { exact: true })).toContainText("Heldy Team");
    await expect(page.getByRole("button", { name: /^Focal point/ })).toHaveAccessibleName(/30% from the left, 75% from the top/);
    await expect(page.getByRole("textbox", { name: "Article content" }).locator(".blog-callout")).toHaveAttribute("data-tone", "warning");

    await page.setViewportSize({ width: 390, height: 844 });
    await expectCleanLayout(page, "editor mobile");
  });

  test("manages author profiles and keeps bylines in step", async ({ page }) => {
    const backend = new BlogBackend();
    backend.authors.push({ ...TEAM });
    const post = makePost({ title: "Linked", slug: "linked", author: TEAM.name, author_id: TEAM.id });
    backend.posts.push(post);
    await backend.install(page, { asAdmin: true });
    await page.goto("/admin/blog");
    await page.getByRole("navigation", { name: "Admin sections" }).getByRole("link", { name: "Authors" }).click();
    await expect(page).toHaveURL(/\/admin\/blog\/authors$/);
    await expect(page.getByRole("heading", { level: 1, name: "Authors" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Heldy Team" })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expectCleanLayout(page, "authors mobile");
    await page.getByRole("button", { name: "Add author" }).first().click();
    await expectCleanLayout(page, "author dialog mobile", '[role="dialog"]');
    await page.keyboard.press("Escape");
    // Let the closing dialog leave the page before opening it again.
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.setViewportSize({ width: 1280, height: 800 });

    // Add an author.
    await page.getByRole("button", { name: "Add author" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Add an author" });
    await dialog.getByRole("button", { name: "Add author" }).click();
    await expect(dialog.getByRole("alert")).toHaveText("Add the author's name.");
    await dialog.getByLabel("Name", { exact: true }).fill("Jordan Lee");
    await dialog.getByLabel("Role (optional)").fill("Writer");
    await dialog.getByLabel("Short bio (optional)").fill("Writes about South Florida road trips.");
    await dialog.getByRole("button", { name: "Add author" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("heading", { name: "Jordan Lee" })).toBeVisible();
    expect(backend.authors.find((a) => a.name === "Jordan Lee")).toMatchObject({ slug: "jordan-lee", role: "Writer" });

    // Renaming updates the byline on linked posts.
    await page.getByRole("button", { name: "Edit Heldy Team" }).click();
    const edit = page.getByRole("dialog", { name: "Edit author" });
    await edit.getByLabel("Name", { exact: true }).fill("The Heldy Family");
    await edit.getByRole("button", { name: "Save author" }).click();
    await expect(edit).toBeHidden();
    await expect(page.getByRole("heading", { name: "The Heldy Family" })).toBeVisible();
    expect(post.author).toBe("The Heldy Family");

    // Deleting keeps the post's byline but unlinks the profile.
    await page.getByRole("button", { name: "Delete The Heldy Family" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete author" }).click();
    await expect(page.getByRole("heading", { name: "The Heldy Family" })).toHaveCount(0);
    expect(post).toMatchObject({ author: "The Heldy Family", author_id: null });
  });
});
