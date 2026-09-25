// Shared blog types. Kept free of browser/React imports and path aliases so
// the Vercel Functions in /api can import them too.

export const BLOG_STATUSES = ["draft", "scheduled", "published"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

/** A ProseMirror/Tiptap JSON node. Only an allow-listed subset is rendered. */
export interface RichTextMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface RichTextNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
  marks?: RichTextMark[];
  text?: string;
}

export interface RichTextDoc extends RichTextNode {
  type: "doc";
}

export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
}

export interface BlogTag {
  id: string;
  slug: string;
  name: string;
}

export interface BlogSource {
  id?: string;
  name: string;
  url: string;
  publisher: string | null;
  position?: number;
}

/** Columns shown on public cards and listings. */
export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  featured_image_alt: string | null;
  featured_image_width: number | null;
  featured_image_height: number | null;
  author: string;
  status: BlogStatus;
  published_at: string | null;
  last_updated_at: string | null;
  category: Pick<BlogCategory, "id" | "slug" | "name"> | null;
}

export interface BlogPost extends BlogPostSummary {
  content: RichTextDoc;
  category_id: string | null;
  seo_title: string | null;
  meta_description: string | null;
  primary_keyword: string | null;
  canonical_url: string | null;
  social_title: string | null;
  social_description: string | null;
  cta_label: string | null;
  cta_url: string | null;
  created_at: string;
  updated_at: string;
  tags: BlogTag[];
  sources: BlogSource[];
}

export const EMPTY_DOC: RichTextDoc = { type: "doc", content: [] };
