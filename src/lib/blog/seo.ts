import { docToPlainText, wordCount } from "./content.js";
import type { BlogPost, BlogPostSummary } from "./types.js";

// Metadata + structured data for the blog. Used by BOTH the React pages
// (react-helmet) and the Vercel Function that pre-renders <head> for
// crawlers/social scrapers, so the two can never disagree. Everything is
// derived from real CMS values: nothing is invented (no ratings, reviews,
// prices, fabricated authors or dates).

export const SITE_URL = "https://rentwithheldy.com";
export const SITE_NAME = "Rent With Heldy";
export const BLOG_PATH = "/blog";
export const BLOG_URL = `${SITE_URL}${BLOG_PATH}`;
export const DEFAULT_SHARE_IMAGE = `${SITE_URL}/share-image.png`;
export const PUBLISHER_LOGO = `${SITE_URL}/favicon.png`;

/** Suggested lengths shown in the editor. Guidance only — never enforced. */
export const SEO_TITLE_GUIDE = { min: 30, max: 60 } as const;
export const META_DESCRIPTION_GUIDE = { min: 70, max: 160 } as const;

export const BLOG_INDEX_META = {
  title: "Car Rental Guides & South Florida Travel Blog | Rent With Heldy",
  description:
    "Car rental guides, South Florida travel advice, airport and cruise tips, P2P car-sharing news and rental industry insights from Rent With Heldy.",
} as const;

export function postPath(slug: string): string {
  return `${BLOG_PATH}/${slug}`;
}

export function defaultCanonical(slug: string): string {
  return `${SITE_URL}${postPath(slug)}`;
}

export function categoryPath(categorySlug: string): string {
  return `${BLOG_PATH}?category=${encodeURIComponent(categorySlug)}`;
}

export function absoluteUrl(pathOrUrl: string): string {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

const clean = (value: string | null | undefined) => (value ?? "").trim();

export interface ArticleMeta {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  image: string;
  imageAlt: string;
  hasFeaturedImage: boolean;
  publishedTime: string | null;
  modifiedTime: string | null;
}

type MetaSource = Pick<
  BlogPost,
  | "title"
  | "slug"
  | "excerpt"
  | "content"
  | "featured_image"
  | "featured_image_alt"
  | "published_at"
  | "last_updated_at"
  | "seo_title"
  | "meta_description"
  | "canonical_url"
  | "social_title"
  | "social_description"
>;

export function resolveArticleMeta(post: MetaSource): ArticleMeta {
  const title = clean(post.seo_title) || `${clean(post.title)} | ${SITE_NAME}`;
  const description =
    clean(post.meta_description) ||
    clean(post.excerpt) ||
    truncate(docToPlainText(post.content), META_DESCRIPTION_GUIDE.max);
  const featured = clean(post.featured_image);
  return {
    title,
    description,
    canonical: clean(post.canonical_url) || defaultCanonical(post.slug),
    ogTitle: clean(post.social_title) || clean(post.seo_title) || clean(post.title),
    ogDescription: clean(post.social_description) || description,
    image: featured ? absoluteUrl(featured) : DEFAULT_SHARE_IMAGE,
    imageAlt: featured ? clean(post.featured_image_alt) || clean(post.title) : SITE_NAME,
    hasFeaturedImage: Boolean(featured),
    publishedTime: post.published_at,
    modifiedTime: post.last_updated_at ?? post.published_at,
  };
}

export interface Crumb {
  name: string;
  path: string;
}

/**
 * The visible breadcrumb trail on an article: Blog › Category › Article.
 * BreadcrumbList schema is built from the same array so they always match.
 */
export function articleCrumbs(
  post: Pick<BlogPost, "title" | "slug"> & { category: BlogPostSummary["category"] },
  labels: { blog: string; category?: string } = { blog: "Blog" },
): Crumb[] {
  const crumbs: Crumb[] = [{ name: labels.blog, path: BLOG_PATH }];
  if (post.category) {
    crumbs.push({ name: labels.category ?? post.category.name, path: categoryPath(post.category.slug) });
  }
  crumbs.push({ name: post.title, path: postPath(post.slug) });
  return crumbs;
}

export function breadcrumbSchema(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

const publisher = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: PUBLISHER_LOGO },
};

type SchemaSource = MetaSource &
  Pick<BlogPost, "author" | "primary_keyword"> & {
    category: BlogPostSummary["category"];
    tags?: { name: string }[];
  };

export function blogPostingSchema(post: SchemaSource) {
  const meta = resolveArticleMeta(post);
  const author = clean(post.author) || SITE_NAME;
  const keywords = [
    clean(post.primary_keyword),
    ...(post.tags ?? []).map((tag) => clean(tag.name)),
  ].filter(Boolean);
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${meta.canonical}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": meta.canonical },
    url: meta.canonical,
    headline: truncate(clean(post.title), 110),
    description: meta.description,
    author:
      author === SITE_NAME
        ? { "@type": "Organization", name: SITE_NAME, url: SITE_URL }
        : { "@type": "Person", name: author },
    publisher,
    inLanguage: "en",
    wordCount: wordCount(post.content),
  };
  if (meta.hasFeaturedImage) schema.image = [meta.image];
  if (meta.publishedTime) schema.datePublished = meta.publishedTime;
  if (meta.modifiedTime) schema.dateModified = meta.modifiedTime;
  if (post.category) schema.articleSection = post.category.name;
  if (keywords.length) schema.keywords = [...new Set(keywords)].join(", ");
  return schema;
}

export function blogIndexSchema(posts: Pick<BlogPostSummary, "title" | "slug" | "published_at">[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${BLOG_URL}#blog`,
    url: BLOG_URL,
    name: `${SITE_NAME} Blog`,
    description: BLOG_INDEX_META.description,
    inLanguage: "en",
    publisher,
    blogPost: posts.slice(0, 20).map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: defaultCanonical(post.slug),
      ...(post.published_at ? { datePublished: post.published_at } : {}),
    })),
  };
}
