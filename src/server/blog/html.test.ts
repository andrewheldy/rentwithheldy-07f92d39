import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { BlogPost } from "../../lib/blog/types";
import { articleHeadTags, blogSitemapXml, indexHeadTags, injectHead, jsonForScript, notFoundHeadTags } from "./html";

const shell = readFileSync(resolve(__dirname, "../../../index.html"), "utf8");

const post: BlogPost = {
  id: "p1",
  title: 'Airport </script><script>alert("x")</script> "Delivery"',
  slug: "airport-delivery",
  excerpt: "Excerpt & more",
  content: { type: "doc", content: [] },
  featured_image: null,
  featured_image_alt: null,
  featured_image_width: null,
  featured_image_height: null,
  category_id: null,
  category: null,
  author: "Rent With Heldy",
  status: "published",
  published_at: "2026-09-01T14:00:00.000Z",
  last_updated_at: null,
  seo_title: null,
  meta_description: null,
  primary_keyword: null,
  canonical_url: null,
  social_title: null,
  social_description: null,
  cta_label: null,
  cta_url: null,
  created_at: "2026-09-01T14:00:00.000Z",
  updated_at: "2026-09-01T14:00:00.000Z",
  tags: [],
  sources: [],
};

describe("server-rendered blog head", () => {
  const html = injectHead(shell, articleHeadTags(post));

  it("replaces the generic homepage tags instead of duplicating them", () => {
    expect(html.match(/<title/g)).toHaveLength(1);
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html.match(/property="og:title"/g)).toHaveLength(1);
    expect(html.match(/property="og:image"/g)).toHaveLength(1);
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html).toContain('<link data-rh="true" rel="canonical" href="https://rentwithheldy.com/blog/airport-delivery">');
    expect(html).toContain('property="og:type" content="article"');
    expect(html).toContain('name="robots" content="index, follow, max-image-preview:large"');
    // Site-wide Organization/WebSite JSON-LD and the app bundle are untouched.
    expect(html).toContain('"@type": "Organization"');
    expect(html).toContain('<div id="root"></div>');
  });

  it("escapes CMS values in attributes and JSON-LD", () => {
    expect(html).not.toContain('<script>alert("x")</script>');
    expect(html).toContain("Airport &lt;/script&gt;&lt;script&gt;alert(&quot;x&quot;)");
    expect(jsonForScript({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}');
  });

  it("marks not-found pages noindex and gives the index its own canonical", () => {
    expect(injectHead(shell, notFoundHeadTags())).toContain('name="robots" content="noindex, nofollow"');
    const index = injectHead(shell, indexHeadTags([]));
    expect(index).toContain('href="https://rentwithheldy.com/blog"');
    expect(index).toContain("Car Rental Guides &amp; South Florida Travel Blog | Rent With Heldy");
  });
});

describe("blog sitemap", () => {
  it("lists self-canonical posts with lastmod", () => {
    const xml = blogSitemapXml([
      { slug: "a", published_at: "2026-09-01T10:00:00Z", last_updated_at: "2026-09-10T10:00:00Z", canonical_url: null },
      { slug: "b", published_at: "2026-09-02T10:00:00Z", last_updated_at: null, canonical_url: "https://rentwithheldy.com/blog/b" },
      { slug: "c", published_at: "2026-09-03T10:00:00Z", last_updated_at: null, canonical_url: "https://example.com/elsewhere" },
    ]);
    expect(xml).toContain("<loc>https://rentwithheldy.com/blog/a</loc>\n    <lastmod>2026-09-10</lastmod>");
    expect(xml).toContain("<loc>https://rentwithheldy.com/blog/b</loc>\n    <lastmod>2026-09-02</lastmod>");
    expect(xml).not.toContain("/blog/c");
  });
  it("is a valid empty urlset when nothing is published", () => {
    expect(blogSitemapXml([])).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n',
    );
  });
});
