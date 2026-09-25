import {
  BLOG_INDEX_META,
  BLOG_PATH,
  BLOG_URL,
  DEFAULT_SHARE_IMAGE,
  SITE_NAME,
  articleCrumbs,
  blogIndexSchema,
  blogPostingSchema,
  breadcrumbSchema,
  resolveArticleMeta,
} from "../../lib/blog/seo.js";
import type { BlogPost, BlogPostSummary } from "../../lib/blog/types.js";

// Server-side <head> for blog URLs. The site is a client-rendered SPA, so
// without this, link-preview scrapers (Facebook, LinkedIn, iMessage, Slack…)
// and non-JS crawlers would only ever see the generic homepage tags in
// index.html. The tags are emitted with data-rh="true" so react-helmet-async
// replaces them (rather than duplicating them) once the app boots.

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** JSON for a <script> body: "<" is escaped so "</script>" cannot appear. */
export function jsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

type Tag =
  | { kind: "title"; text: string }
  | { kind: "meta"; attr: "name" | "property"; key: string; content: string }
  | { kind: "link"; rel: string; href: string }
  | { kind: "jsonld"; data: unknown };

function renderTag(tag: Tag): string {
  switch (tag.kind) {
    case "title":
      return `<title data-rh="true">${escapeHtml(tag.text)}</title>`;
    case "meta":
      return `<meta data-rh="true" ${tag.attr}="${escapeHtml(tag.key)}" content="${escapeHtml(tag.content)}">`;
    case "link":
      return `<link data-rh="true" rel="${escapeHtml(tag.rel)}" href="${escapeHtml(tag.href)}">`;
    case "jsonld":
      return `<script data-rh="true" type="application/ld+json">${jsonForScript(tag.data)}</script>`;
  }
}

// Generic tags in index.html that a blog page must replace, not duplicate.
const REPLACED_HEAD_PATTERNS = [
  /<title>[\s\S]*?<\/title>\s*/i,
  /<meta[^>]+name="description"[^>]*>\s*/gi,
  /<meta[^>]+property="og:(?:type|title|description|image|url)"[^>]*>\s*/gi,
  /<meta[^>]+name="twitter:(?:card|title|description|image)"[^>]*>\s*/gi,
  /<link[^>]+rel="canonical"[^>]*>\s*/gi,
  /<meta[^>]+name="robots"[^>]*>\s*/gi,
];

export function injectHead(shell: string, tags: Tag[]): string {
  let html = shell;
  for (const pattern of REPLACED_HEAD_PATTERNS) html = html.replace(pattern, "");
  const block = tags.map(renderTag).join("\n    ");
  return html.replace(/<\/head>/i, `    ${block}\n  </head>`);
}

interface SocialFields {
  title: string;
  description: string;
  url: string;
  image: string;
  imageAlt: string;
  type: "website" | "article";
}

function socialTags(social: SocialFields): Tag[] {
  return [
    { kind: "meta", attr: "property", key: "og:type", content: social.type },
    { kind: "meta", attr: "property", key: "og:site_name", content: SITE_NAME },
    { kind: "meta", attr: "property", key: "og:title", content: social.title },
    { kind: "meta", attr: "property", key: "og:description", content: social.description },
    { kind: "meta", attr: "property", key: "og:url", content: social.url },
    { kind: "meta", attr: "property", key: "og:image", content: social.image },
    { kind: "meta", attr: "property", key: "og:image:alt", content: social.imageAlt },
    { kind: "meta", attr: "name", key: "twitter:card", content: "summary_large_image" },
    { kind: "meta", attr: "name", key: "twitter:title", content: social.title },
    { kind: "meta", attr: "name", key: "twitter:description", content: social.description },
    { kind: "meta", attr: "name", key: "twitter:image", content: social.image },
    { kind: "meta", attr: "name", key: "twitter:image:alt", content: social.imageAlt },
  ];
}

export function articleHeadTags(post: BlogPost): Tag[] {
  const meta = resolveArticleMeta(post);
  const tags: Tag[] = [
    { kind: "title", text: meta.title },
    { kind: "meta", attr: "name", key: "description", content: meta.description },
    { kind: "meta", attr: "name", key: "robots", content: "index, follow, max-image-preview:large" },
    { kind: "link", rel: "canonical", href: meta.canonical },
    ...socialTags({
      title: meta.ogTitle,
      description: meta.ogDescription,
      url: meta.canonical,
      image: meta.image,
      imageAlt: meta.imageAlt,
      type: "article",
    }),
  ];
  if (meta.publishedTime) tags.push({ kind: "meta", attr: "property", key: "article:published_time", content: meta.publishedTime });
  if (meta.modifiedTime) tags.push({ kind: "meta", attr: "property", key: "article:modified_time", content: meta.modifiedTime });
  if (post.category) tags.push({ kind: "meta", attr: "property", key: "article:section", content: post.category.name });
  post.tags.forEach((tag) => tags.push({ kind: "meta", attr: "property", key: "article:tag", content: tag.name }));
  tags.push({ kind: "jsonld", data: blogPostingSchema(post) });
  // English labels = what the English article renders (Blog › Category › Title).
  tags.push({ kind: "jsonld", data: breadcrumbSchema(articleCrumbs(post)) });
  return tags;
}

export function indexHeadTags(posts: BlogPostSummary[]): Tag[] {
  return [
    { kind: "title", text: BLOG_INDEX_META.title },
    { kind: "meta", attr: "name", key: "description", content: BLOG_INDEX_META.description },
    { kind: "link", rel: "canonical", href: BLOG_URL },
    ...socialTags({
      title: BLOG_INDEX_META.title,
      description: BLOG_INDEX_META.description,
      url: BLOG_URL,
      image: DEFAULT_SHARE_IMAGE,
      imageAlt: SITE_NAME,
      type: "website",
    }),
    { kind: "jsonld", data: blogIndexSchema(posts) },
    {
      kind: "jsonld",
      data: breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Blog", path: BLOG_PATH },
      ]),
    },
  ];
}

export function notFoundHeadTags(): Tag[] {
  return [
    { kind: "title", text: `Article not found | ${SITE_NAME}` },
    { kind: "meta", attr: "name", key: "robots", content: "noindex, nofollow" },
  ];
}

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

export interface SitemapEntry {
  slug: string;
  published_at: string | null;
  last_updated_at: string | null;
  canonical_url: string | null;
}

/**
 * Only self-canonical live posts are listed: a post whose canonical points
 * elsewhere should not be submitted as its own URL.
 */
export function blogSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const loc = `${BLOG_URL}/${entry.slug}`;
      if (entry.canonical_url && entry.canonical_url.replace(/\/$/, "") !== loc) return null;
      const modified = entry.last_updated_at ?? entry.published_at;
      const lastmod = modified ? `\n    <lastmod>${new Date(modified).toISOString().slice(0, 10)}</lastmod>` : "";
      return `  <url>\n    <loc>${escapeHtml(loc)}</loc>${lastmod}\n  </url>`;
    })
    .filter(Boolean);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}${urls.length ? "\n" : ""}</urlset>\n`;
}
