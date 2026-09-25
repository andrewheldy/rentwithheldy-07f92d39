import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import enBlog from "@/i18n/locales/en/blog.json";
import { collectLinks, docToPlainText, hasContent, internalPath, isHttpUrl, normalizeDoc, readingMinutes, safeHref, safeImageSrc } from "./content";
import { CTA_PRESETS, INTERNAL_LINKS } from "./presets";
import {
  BLOG_INDEX_META,
  articleCrumbs,
  blogPostingSchema,
  breadcrumbSchema,
  defaultCanonical,
  resolveArticleMeta,
} from "./seo";
import { isValidSlug, slugify } from "./slug";
import { effectiveStatus, hasMeaningfulUpdate, isLive } from "./status";
import type { BlogPost, RichTextDoc } from "./types";

const doc: RichTextDoc = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Meet us at FLL" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Book a " },
        { type: "text", text: "delivered car", marks: [{ type: "link", attrs: { href: "/book" } }] },
        { type: "text", text: " today." },
      ],
    },
  ],
};

const post: BlogPost = {
  id: "p1",
  title: "Can You Have a Rental Car Delivered to Fort Lauderdale Airport?",
  slug: "rental-car-delivery-fort-lauderdale-airport",
  excerpt: "How airport delivery works.",
  content: doc,
  featured_image: "https://cdn.example.com/fll.jpg",
  featured_image_alt: "SUV at FLL arrivals",
  featured_image_width: 2000,
  featured_image_height: 1200,
  category_id: "c1",
  category: { id: "c1", slug: "airport-cruise-travel", name: "Airport & Cruise Travel" },
  author: "Rent With Heldy",
  status: "published",
  published_at: "2026-09-01T14:00:00.000Z",
  last_updated_at: "2026-09-20T14:00:00.000Z",
  seo_title: null,
  meta_description: null,
  primary_keyword: "fll car delivery",
  canonical_url: null,
  social_title: null,
  social_description: null,
  cta_label: "Browse Available Cars",
  cta_url: "/book",
  created_at: "2026-08-30T00:00:00.000Z",
  updated_at: "2026-09-20T14:00:00.000Z",
  tags: [{ id: "t1", slug: "fll", name: "FLL" }],
  sources: [],
};

describe("slugs", () => {
  it("builds clean slugs from titles", () => {
    expect(slugify("Can You Have a Rental Car Delivered to Fort Lauderdale Airport?")).toBe(
      "can-you-have-a-rental-car-delivered-to-fort-lauderdale-airport",
    );
    expect(slugify("Café & Cruise: Don't Miss PortMiami!")).toBe("cafe-and-cruise-dont-miss-portmiami");
    expect(slugify("  --Hello   World--  ")).toBe("hello-world");
  });
  it("cuts long slugs on a word boundary", () => {
    const slug = slugify("word ".repeat(60), 30);
    expect(slug.length).toBeLessThanOrEqual(30);
    expect(slug.endsWith("-")).toBe(false);
    expect(isValidSlug(slug)).toBe(true);
  });
  it("validates like the database CHECK constraint", () => {
    expect(isValidSlug("fll-airport-delivery")).toBe(true);
    for (const bad of ["", "Upper", "double--dash", "-lead", "trail-", "spa ce", "émoji"]) {
      expect(isValidSlug(bad)).toBe(false);
    }
  });
});

describe("publishing status", () => {
  const now = new Date("2026-09-25T12:00:00Z");
  it("drafts are never live", () => {
    expect(isLive({ status: "draft", published_at: "2026-01-01T00:00:00Z" }, now)).toBe(false);
  });
  it("scheduled posts go live exactly at their publish time", () => {
    const future = { status: "scheduled" as const, published_at: "2026-09-26T00:00:00Z" };
    const past = { status: "scheduled" as const, published_at: "2026-09-24T00:00:00Z" };
    expect(isLive(future, now)).toBe(false);
    expect(effectiveStatus(future, now)).toBe("scheduled");
    expect(isLive(past, now)).toBe(true);
    expect(effectiveStatus(past, now)).toBe("published");
  });
  it("only shows an update date when it's at least a day after publishing", () => {
    expect(hasMeaningfulUpdate("2026-09-01T00:00:00Z", "2026-09-01T10:00:00Z")).toBe(false);
    expect(hasMeaningfulUpdate("2026-09-01T00:00:00Z", "2026-09-03T00:00:00Z")).toBe(true);
    expect(hasMeaningfulUpdate(null, "2026-09-03T00:00:00Z")).toBe(false);
  });
});

describe("link and image safety", () => {
  it("allows site paths, http(s), mailto and tel", () => {
    for (const ok of ["/book", "#faq", "https://example.com", "http://example.com", "mailto:a@b.co", "tel:+15555555555"]) {
      expect(safeHref(ok)).toBe(ok);
    }
  });
  it("rejects script and protocol-relative URLs", () => {
    for (const bad of ["javascript:alert(1)", "JAVASCRIPT:alert(1)", "data:text/html,x", "//evil.com", "vbscript:x", "", 42]) {
      expect(safeHref(bad)).toBeNull();
    }
    expect(safeImageSrc("javascript:alert(1)")).toBeNull();
    expect(safeImageSrc("data:image/png;base64,AAA")).toBeNull();
    expect(safeImageSrc("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
  });
  it("treats our own domain as internal", () => {
    expect(internalPath("/local-car-rentals")).toBe("/local-car-rentals");
    expect(internalPath("https://rentwithheldy.com/book?x=1#y")).toBe("/book?x=1#y");
    expect(internalPath("https://www.rentwithheldy.com/faq")).toBe("/faq");
    expect(internalPath("https://example.com/book")).toBeNull();
  });
  it("requires full URLs for sources", () => {
    expect(isHttpUrl("https://www.broward.org/airport")).toBe(true);
    expect(isHttpUrl("broward.org")).toBe(false);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("document helpers", () => {
  it("extracts text, links and reading time", () => {
    expect(docToPlainText(doc)).toBe("Meet us at FLL Book a delivered car today.");
    expect(collectLinks(doc)).toEqual(["/book"]);
    expect(readingMinutes(doc)).toBe(1);
    expect(hasContent(doc)).toBe(true);
    expect(hasContent({ type: "doc", content: [{ type: "paragraph" }] })).toBe(false);
  });
  it("normalizes malformed stored content to an empty document", () => {
    expect(normalizeDoc(null)).toEqual({ type: "doc", content: [] });
    expect(normalizeDoc({ type: "paragraph" })).toEqual({ type: "doc", content: [] });
    expect(normalizeDoc(doc)).toEqual(doc);
  });
});

describe("SEO", () => {
  it("defaults title, description and canonical from real CMS values", () => {
    const meta = resolveArticleMeta(post);
    expect(meta.title).toBe(`${post.title} | Rent With Heldy`);
    expect(meta.description).toBe("How airport delivery works.");
    expect(meta.canonical).toBe("https://rentwithheldy.com/blog/rental-car-delivery-fort-lauderdale-airport");
    expect(meta.image).toBe(post.featured_image);
    expect(meta.modifiedTime).toBe(post.last_updated_at);
  });
  it("honors SEO overrides and falls back to article text for descriptions", () => {
    const meta = resolveArticleMeta({ ...post, seo_title: "Custom", meta_description: "Meta", canonical_url: "https://example.com/x", social_title: "Social" });
    expect(meta).toMatchObject({ title: "Custom", description: "Meta", canonical: "https://example.com/x", ogTitle: "Social", ogDescription: "Meta" });
    expect(resolveArticleMeta({ ...post, excerpt: "" }).description).toBe("Meet us at FLL Book a delivered car today.");
    expect(defaultCanonical("abc")).toBe("https://rentwithheldy.com/blog/abc");
  });
  it("builds BlogPosting schema without invented data", () => {
    const schema = blogPostingSchema(post);
    expect(schema["@type"]).toBe("BlogPosting");
    expect(schema.datePublished).toBe(post.published_at);
    expect(schema.dateModified).toBe(post.last_updated_at);
    expect(schema.author).toEqual({ "@type": "Organization", name: "Rent With Heldy", url: "https://rentwithheldy.com" });
    expect(schema.image).toEqual([post.featured_image]);
    expect(schema.keywords).toBe("fll car delivery, FLL");
    const json = JSON.stringify(schema);
    expect(json).not.toMatch(/aggregateRating|review|price/i);
    // A named person author is a Person; no image means no image property.
    const personal = blogPostingSchema({ ...post, author: "Heldy", featured_image: null });
    expect(personal.author).toEqual({ "@type": "Person", name: "Heldy" });
    expect(personal).not.toHaveProperty("image");
  });
  it("breadcrumb schema mirrors the visible Blog › Category › Article trail", () => {
    const crumbs = articleCrumbs(post);
    expect(crumbs.map((c) => c.name)).toEqual(["Blog", "Airport & Cruise Travel", post.title]);
    const schema = breadcrumbSchema(crumbs);
    expect(schema.itemListElement.map((i) => i.item)).toEqual([
      "https://rentwithheldy.com/blog",
      "https://rentwithheldy.com/blog?category=airport-cruise-travel",
      "https://rentwithheldy.com/blog/rental-car-delivery-fort-lauderdale-airport",
    ]);
    expect(articleCrumbs({ ...post, category: null }).length).toBe(2);
  });
  it("keeps the server-rendered blog index meta in sync with the English locale", () => {
    expect(enBlog.index.meta).toEqual(BLOG_INDEX_META);
  });
});

describe("editor presets", () => {
  const app = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8");
  const routes = new Set([...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]));
  it("only point at routes that exist", () => {
    for (const { url } of CTA_PRESETS) expect(routes.has(url)).toBe(true);
    for (const { path } of INTERNAL_LINKS) expect(routes.has(path)).toBe(true);
  });
  it("covers the requested CTA presets", () => {
    expect(CTA_PRESETS.map((p) => p.label)).toEqual([
      "Browse Available Cars",
      "Plan My Trip",
      "See Airport Rental Options",
      "Have a Car Delivered",
      "Contact Rent With Heldy",
      "Be Our Guest",
    ]);
  });
});
