#!/usr/bin/env node
// Blog posts written as Markdown in content/blog/*.md → Tiptap JSON → SQL.
//
//   node scripts/blog-posts.mjs            writes content/blog/import-drafts.sql
//   node scripts/blog-posts.mjs --check    fails if that file is out of date
//
// The SQL inserts each post as a DRAFT (never public) and skips any slug that
// already exists, so running it again never overwrites edits made in
// /admin/blog. Paste it into the Supabase SQL editor for the production
// project, then add a featured image and publish from /admin/blog.
//
// Only the Markdown the article renderer supports is recognised: ## / ###
// headings, paragraphs, - and 1. lists, > quotes, --- rules, | tables |,
// **bold**, *italic* and [links](/path-or-https-url).

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const CONTENT_DIR = join(ROOT, "content/blog");
export const SQL_FILE = join(CONTENT_DIR, "import-drafts.sql");

// Mirrors src/lib/blog/presets.ts CTA_PRESETS (checked by blog-posts.test.ts).
export const CTA_BY_ID = {
  browse: { label: "Browse Available Cars", url: "/book" },
  plan: { label: "Plan My Trip", url: "/trip-planner" },
  airport: { label: "See Airport Rental Options", url: "/fort-lauderdale-airport-car-rental" },
  delivered: { label: "Have a Car Delivered", url: "/local-car-rentals" },
  contact: { label: "Contact Rent With Heldy", url: "/contact" },
  guest: { label: "Be Our Guest", url: "/book" },
};

// ---------------------------------------------------------------------------
// Front matter: a flat "key: value" block; `tags` is comma separated and
// `sources` is a list of "- name | url | publisher" lines.
// ---------------------------------------------------------------------------

function parseFrontMatter(raw, file) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!match) throw new Error(`${file}: missing front matter`);
  const meta = { sources: [] };
  let inSources = false;
  for (const line of match[1].split("\n")) {
    if (!line.trim()) continue;
    if (inSources && /^\s+- /.test(line)) {
      const [name, url, publisher] = line.replace(/^\s+- /, "").split(" | ").map((s) => s.trim());
      meta.sources.push({ name, url, publisher: publisher || null });
      continue;
    }
    const kv = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (!kv) throw new Error(`${file}: bad front matter line: ${line}`);
    inSources = kv[1] === "sources";
    if (!inSources) meta[kv[1]] = kv[2].trim();
  }
  meta.tags = meta.tags ? meta.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
  return { meta, body: match[2] };
}

// ---------------------------------------------------------------------------
// Markdown → Tiptap JSON
// ---------------------------------------------------------------------------

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function inline(text, marks = []) {
  const nodes = [];
  let last = 0;
  const push = (t, m) => {
    if (!t) return;
    const node = { type: "text", text: t };
    if (m.length) node.marks = m;
    nodes.push(node);
  };
  for (const m of text.matchAll(INLINE)) {
    push(text.slice(last, m.index), marks);
    if (m[1] !== undefined) nodes.push(...inline(m[1], [...marks, { type: "bold" }]));
    else if (m[2] !== undefined) nodes.push(...inline(m[2], [...marks, { type: "italic" }]));
    else nodes.push(...inline(m[3], [...marks, { type: "link", attrs: { href: m[4] } }]));
    last = m.index + m[0].length;
  }
  push(text.slice(last), marks);
  return nodes;
}

const paragraph = (text) => ({ type: "paragraph", content: inline(text) });
const cells = (row) => row.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export function markdownToDoc(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const content = [];
  let i = 0;
  const collect = (test) => {
    const out = [];
    while (i < lines.length && test(lines[i])) out.push(lines[i++]);
    return out;
  };

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
    } else if (/^#{2,3} /.test(line)) {
      const level = line.startsWith("### ") ? 3 : 2;
      content.push({ type: "heading", attrs: { level }, content: inline(line.replace(/^#+ /, "").trim()) });
      i++;
    } else if (/^---\s*$/.test(line)) {
      content.push({ type: "horizontalRule" });
      i++;
    } else if (/^- /.test(line)) {
      const items = collect((l) => /^- /.test(l));
      content.push({
        type: "bulletList",
        content: items.map((l) => ({ type: "listItem", content: [paragraph(l.slice(2).trim())] })),
      });
    } else if (/^\d+\. /.test(line)) {
      const items = collect((l) => /^\d+\. /.test(l));
      content.push({
        type: "orderedList",
        attrs: { start: 1 },
        content: items.map((l) => ({ type: "listItem", content: [paragraph(l.replace(/^\d+\. /, "").trim())] })),
      });
    } else if (/^> /.test(line)) {
      const quote = collect((l) => /^> /.test(l)).map((l) => l.slice(2).trim());
      content.push({ type: "blockquote", content: [paragraph(quote.join(" "))] });
    } else if (/^\|/.test(line)) {
      const rows = collect((l) => /^\|/.test(l)).filter((l) => !/^\|[\s:|-]+\|$/.test(l.trim()));
      content.push({
        type: "table",
        content: rows.map((row, r) => ({
          type: "tableRow",
          content: cells(row).map((c) => ({
            type: r === 0 ? "tableHeader" : "tableCell",
            attrs: { colspan: 1, rowspan: 1, colwidth: null },
            content: [paragraph(c)],
          })),
        })),
      });
    } else {
      const text = collect((l) => l.trim() && !/^(#{2,3} |- |\d+\. |> |\||---\s*$)/.test(l));
      content.push(paragraph(text.map((l) => l.trim()).join(" ")));
    }
  }
  return { type: "doc", content };
}

// ---------------------------------------------------------------------------
// Load posts
// ---------------------------------------------------------------------------

export function slugifyTag(name) {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function loadPosts(dir = CONTENT_DIR) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort()
    .map((file) => {
      const { meta, body } = parseFrontMatter(readFileSync(join(dir, file), "utf8"), file);
      const cta = meta.cta ? CTA_BY_ID[meta.cta] : null;
      if (meta.cta && !cta) throw new Error(`${file}: unknown cta preset "${meta.cta}"`);
      return {
        file,
        title: meta.title,
        slug: meta.slug,
        excerpt: meta.excerpt ?? "",
        category: meta.category ?? null,
        author: meta.author || "Rent With Heldy",
        seo_title: meta.seo_title || null,
        meta_description: meta.meta_description || null,
        primary_keyword: meta.primary_keyword || null,
        cta_label: cta?.label ?? null,
        cta_url: cta?.url ?? null,
        tags: meta.tags,
        sources: meta.sources,
        content: markdownToDoc(body),
      };
    });
}

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

const lit = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);

function dollar(text) {
  let tag = "json";
  while (text.includes(`$${tag}$`)) tag += "_";
  return `$${tag}$${text}$${tag}$`;
}

function postSql(post) {
  const tagRows = post.tags.map((t) => `(${lit(slugifyTag(t))}, ${lit(t)})`).join(",\n    ");
  const sourceRows = post.sources
    .map((s, i) => `(${i}, ${lit(s.name)}, ${lit(s.url)}, ${lit(s.publisher)})`)
    .join(",\n      ");
  return `-- ${post.file}
DO $post$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.blog_posts
    (title, slug, excerpt, content, category_id, author, status,
     seo_title, meta_description, primary_keyword, cta_label, cta_url)
  VALUES (
    ${lit(post.title)},
    ${lit(post.slug)},
    ${lit(post.excerpt)},
    ${dollar(JSON.stringify(post.content))}::jsonb,
    (SELECT id FROM public.blog_categories WHERE slug = ${lit(post.category)}),
    ${lit(post.author)},
    'draft',
    ${lit(post.seo_title)},
    ${lit(post.meta_description)},
    ${lit(post.primary_keyword)},
    ${lit(post.cta_label)},
    ${lit(post.cta_url)}
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO new_id;

  IF new_id IS NULL THEN
    RAISE NOTICE 'Skipped %: a post with this slug already exists', ${lit(post.slug)};
    RETURN;
  END IF;
${
  post.tags.length
    ? `
  INSERT INTO public.blog_tags (slug, name) VALUES
    ${tagRows}
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.blog_post_tags (post_id, tag_id)
  SELECT new_id, id FROM public.blog_tags WHERE slug IN (${post.tags.map((t) => lit(slugifyTag(t))).join(", ")});
`
    : ""
}${
  post.sources.length
    ? `
  INSERT INTO public.blog_post_sources (post_id, position, name, url, publisher)
  SELECT new_id, s.position, s.name, s.url, s.publisher
  FROM (VALUES
      ${sourceRows}
  ) AS s(position, name, url, publisher);
`
    : ""
}END
$post$;
`;
}

export function buildSql(posts) {
  return `-- GENERATED by scripts/blog-posts.mjs from content/blog/*.md — do not edit by hand.
-- Inserts each post as a DRAFT. Existing slugs are skipped, never overwritten.
-- Run in the Supabase SQL editor (production project), then finish and
-- publish each draft from /admin/blog.

BEGIN;

${posts.map(postSql).join("\n")}
COMMIT;
`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sql = buildSql(loadPosts());
  if (process.argv.includes("--check")) {
    const current = readFileSync(SQL_FILE, "utf8");
    if (current !== sql) {
      console.error("content/blog/import-drafts.sql is out of date. Run: node scripts/blog-posts.mjs");
      process.exit(1);
    }
    console.log("content/blog/import-drafts.sql is up to date.");
  } else {
    writeFileSync(SQL_FILE, sql);
    console.log(`Wrote ${SQL_FILE}`);
  }
}
