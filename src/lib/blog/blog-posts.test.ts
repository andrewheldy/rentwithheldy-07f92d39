import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSql, CTA_BY_ID, loadPosts, markdownToDoc, SQL_FILE } from "../../../scripts/blog-posts.mjs";
import { collectLinks, docToPlainText } from "./content";
import { CTA_PRESETS } from "./presets";
import type { RichTextNode } from "./types";

// The Markdown posts in content/blog/ and the SQL generated from them.

const posts = loadPosts();
const app = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8");
const routes = new Set([...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]));
const categories = readFileSync(resolve(__dirname, "../../../supabase/migrations/20260925081538_blog_cms.sql"), "utf8");

function texts(node: RichTextNode): string[] {
  return [...(node.text ? [node.text] : []), ...(node.content ?? []).flatMap(texts)];
}

describe("content/blog posts", () => {
  it("exist", () => {
    expect(posts.length).toBeGreaterThanOrEqual(3);
  });

  it.each(posts.map((p) => [p.file, p]))("%s fits the blog_posts schema", (_file, post) => {
    expect(post.title.length).toBeGreaterThan(0);
    expect(post.title.length).toBeLessThanOrEqual(200);
    expect(post.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(post.slug.length).toBeLessThanOrEqual(120);
    expect(post.excerpt.length).toBeGreaterThan(0);
    expect(post.excerpt.length).toBeLessThanOrEqual(600);
    expect(categories).toContain(`('${post.category}',`);
    expect(post.seo_title?.length ?? 0).toBeLessThanOrEqual(200);
    expect(post.meta_description?.length ?? 0).toBeLessThanOrEqual(500);
    expect(post.cta_label === null).toBe(post.cta_url === null);
    for (const s of post.sources) {
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.url).toMatch(/^https:\/\//);
    }
    expect(docToPlainText(post.content).split(/\s+/).length).toBeGreaterThan(600);
  });

  it.each(posts.map((p) => [p.file, p]))("%s links only to real routes or https sites", (_file, post) => {
    const links = collectLinks(post.content);
    expect(links.length).toBeGreaterThan(0);
    for (const href of links) {
      if (href.startsWith("/")) expect(routes.has(href.split(/[?#]/)[0])).toBe(true);
      else expect(href).toMatch(/^https:\/\//);
    }
  });

  it.each(posts.map((p) => [p.file, p]))("%s has no leftover Markdown syntax", (_file, post) => {
    for (const t of texts(post.content)) expect(t).not.toMatch(/\*\*|\]\(|^#{1,6} |\|/);
  });

  it("uses unique slugs", () => {
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
  });

  it("CTA ids mirror the editor presets", () => {
    for (const [id, cta] of Object.entries(CTA_BY_ID)) {
      expect(CTA_PRESETS).toContainEqual({ id, ...(cta as object) });
    }
  });

  it("the generated SQL is up to date and only creates drafts", () => {
    const sql = readFileSync(SQL_FILE, "utf8");
    expect(sql).toBe(buildSql(posts));
    expect(sql).not.toMatch(/'published'|'scheduled'/);
    expect(sql).toMatch(/ON CONFLICT \(slug\) DO NOTHING/);
  });
});

describe("markdownToDoc", () => {
  it("converts the supported subset", () => {
    const doc = markdownToDoc(
      [
        "## Heading",
        "Line one",
        "line two with **bold**, *italic* and [a link](/book).",
        "",
        "- one",
        "- two",
        "",
        "1. first",
        "",
        "| A | B |",
        "| --- | --- |",
        "| 1 | 2 |",
      ].join("\n"),
    );
    expect(doc.content.map((n: RichTextNode) => n.type)).toEqual(["heading", "paragraph", "bulletList", "orderedList", "table"]);
    expect(docToPlainText(doc)).toContain("Line one line two with bold, italic and a link.");
    expect(collectLinks(doc)).toEqual(["/book"]);
    expect(doc.content[4].content[0].content[0].type).toBe("tableHeader");
    expect(doc.content[4].content[1].content[1].type).toBe("tableCell");
  });
});
