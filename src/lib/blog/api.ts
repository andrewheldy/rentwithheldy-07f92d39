import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { normalizeDoc } from "./content";
import { slugify } from "./slug";
import type {
  BlogCategory,
  BlogPost,
  BlogPostSummary,
  BlogSource,
  BlogStatus,
  BlogTag,
  RichTextDoc,
} from "./types";

// Data access for the blog. Public functions ALWAYS filter to live posts
// explicitly, even though RLS already hides drafts from visitors — an admin
// browsing /blog is allowed by RLS to read drafts, and must still only see
// what the public sees. Admin functions rely on RLS (has_role 'admin') for
// authorization, the same model as the existing leads/fleet admin tools.

const SUMMARY_COLUMNS =
  "id,title,slug,excerpt,featured_image,featured_image_alt,featured_image_width,featured_image_height,author,status,published_at,last_updated_at,category:blog_categories(id,slug,name)";

const FULL_COLUMNS =
  "*,category:blog_categories(id,slug,name),post_tags:blog_post_tags(tag:blog_tags(id,slug,name)),sources:blog_post_sources(id,name,url,publisher,position)";

const LIVE_STATUSES: BlogStatus[] = ["published", "scheduled"];

type FullRow = Omit<BlogPost, "tags" | "sources" | "content"> & {
  content: unknown;
  post_tags?: { tag: BlogTag | null }[] | null;
  sources?: BlogSource[] | null;
};

function toPost(row: FullRow): BlogPost {
  const { post_tags, sources, ...rest } = row;
  return {
    ...rest,
    content: normalizeDoc(row.content),
    tags: (post_tags ?? [])
      .map((pt) => pt.tag)
      .filter((tag): tag is BlogTag => Boolean(tag))
      .sort((a, b) => a.name.localeCompare(b.name)),
    sources: [...(sources ?? [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  };
}

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export async function fetchCategories(): Promise<BlogCategory[]> {
  const { data, error } = await supabase
    .from("blog_categories")
    .select("id,slug,name,sort_order")
    .order("sort_order", { ascending: true });
  fail(error);
  return (data ?? []) as BlogCategory[];
}

export async function fetchPublishedPosts(): Promise<BlogPostSummary[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(SUMMARY_COLUMNS)
    .in("status", LIVE_STATUSES)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(200);
  fail(error);
  return (data ?? []) as unknown as BlogPostSummary[];
}

export type PublishedPostResult =
  | { kind: "post"; post: BlogPost }
  | { kind: "redirect"; slug: string }
  | { kind: "not_found" };

export async function fetchPublishedPost(slug: string): Promise<PublishedPostResult> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(FULL_COLUMNS)
    .eq("slug", slug)
    .in("status", LIVE_STATUSES)
    .lte("published_at", now)
    .maybeSingle();
  fail(error);
  if (data) return { kind: "post", post: toPost(data as unknown as FullRow) };

  // Old slug of a live post → permanent redirect to its current URL.
  const { data: redirect, error: redirectError } = await supabase
    .from("blog_slug_redirects")
    .select("post:blog_posts(slug,status,published_at)")
    .eq("old_slug", slug)
    .maybeSingle();
  fail(redirectError);
  const target = (redirect as { post: { slug: string; status: BlogStatus; published_at: string | null } | null } | null)?.post;
  if (target && LIVE_STATUSES.includes(target.status) && target.published_at && new Date(target.published_at) <= new Date(now)) {
    return { kind: "redirect", slug: target.slug };
  }
  return { kind: "not_found" };
}

export async function fetchRelatedPosts(post: Pick<BlogPost, "id" | "category_id">, limit = 3): Promise<BlogPostSummary[]> {
  const all = await fetchPublishedPosts();
  const others = all.filter((p) => p.id !== post.id);
  const sameCategory = others.filter((p) => post.category_id && p.category?.id === post.category_id);
  const rest = others.filter((p) => !sameCategory.includes(p));
  return [...sameCategory, ...rest].slice(0, limit);
}

// ---------------------------------------------------------------------------
// Admin (authorization enforced by RLS: has_role(auth.uid(), 'admin'))
// ---------------------------------------------------------------------------

export async function adminListPosts(): Promise<BlogPostSummary[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`${SUMMARY_COLUMNS},updated_at,created_at`)
    .order("updated_at", { ascending: false })
    .limit(500);
  fail(error);
  return (data ?? []) as unknown as (BlogPostSummary & { updated_at: string; created_at: string })[];
}

export async function adminGetPost(id: string): Promise<BlogPost | null> {
  const { data, error } = await supabase.from("blog_posts").select(FULL_COLUMNS).eq("id", id).maybeSingle();
  fail(error);
  return data ? toPost(data as unknown as FullRow) : null;
}

export async function adminListTags(): Promise<BlogTag[]> {
  const { data, error } = await supabase.from("blog_tags").select("id,slug,name").order("name");
  fail(error);
  return (data ?? []) as BlogTag[];
}

/** True when no other post uses this slug. */
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  let query = supabase.from("blog_posts").select("id").eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query.limit(1);
  fail(error);
  return (data ?? []).length === 0;
}

export interface PostInput {
  title: string;
  slug: string;
  excerpt: string;
  content: RichTextDoc;
  featured_image: string | null;
  featured_image_alt: string | null;
  featured_image_width: number | null;
  featured_image_height: number | null;
  category_id: string | null;
  author: string;
  status: BlogStatus;
  published_at: string | null;
  last_updated_at: string | null;
  seo_title: string | null;
  meta_description: string | null;
  primary_keyword: string | null;
  canonical_url: string | null;
  social_title: string | null;
  social_description: string | null;
  cta_label: string | null;
  cta_url: string | null;
  tags: string[];
  sources: BlogSource[];
}

async function ensureTags(names: string[]): Promise<string[]> {
  const unique = new Map<string, string>();
  for (const name of names) {
    const trimmed = name.trim();
    const slug = slugify(trimmed, 80);
    if (trimmed && slug && !unique.has(slug)) unique.set(slug, trimmed);
  }
  if (unique.size === 0) return [];
  const slugs = [...unique.keys()];
  const { data: existing, error } = await supabase.from("blog_tags").select("id,slug").in("slug", slugs);
  fail(error);
  const found = new Map((existing ?? []).map((tag) => [tag.slug, tag.id]));
  const missing = slugs.filter((slug) => !found.has(slug)).map((slug) => ({ slug, name: unique.get(slug)! }));
  if (missing.length) {
    const { data: created, error: createError } = await supabase.from("blog_tags").insert(missing).select("id,slug");
    fail(createError);
    (created ?? []).forEach((tag) => found.set(tag.slug, tag.id));
  }
  return slugs.map((slug) => found.get(slug)!).filter(Boolean);
}

/** Creates or updates a post with its tags and sources. Returns the id. */
export async function adminSavePost(input: PostInput, id?: string): Promise<string> {
  const { tags, sources, ...rest } = input;
  const columns = { ...rest, content: rest.content as unknown as Json };
  let postId = id;
  if (postId) {
    const { error } = await supabase.from("blog_posts").update(columns).eq("id", postId);
    fail(error);
  } else {
    const { data, error } = await supabase.from("blog_posts").insert(columns).select("id").single();
    fail(error);
    postId = data!.id;
  }

  const tagIds = await ensureTags(tags);
  const { error: clearTagsError } = await supabase.from("blog_post_tags").delete().eq("post_id", postId);
  fail(clearTagsError);
  if (tagIds.length) {
    const { error: tagError } = await supabase
      .from("blog_post_tags")
      .insert(tagIds.map((tag_id) => ({ post_id: postId!, tag_id })));
    fail(tagError);
  }

  const { error: clearSourcesError } = await supabase.from("blog_post_sources").delete().eq("post_id", postId);
  fail(clearSourcesError);
  const cleanSources = sources
    .map((source) => ({
      name: source.name.trim(),
      url: source.url.trim(),
      publisher: source.publisher?.trim() || null,
    }))
    .filter((source) => source.name && source.url);
  if (cleanSources.length) {
    const { error: sourceError } = await supabase
      .from("blog_post_sources")
      .insert(cleanSources.map((source, position) => ({ ...source, position, post_id: postId! })));
    fail(sourceError);
  }
  return postId!;
}

export async function adminSetStatus(id: string, status: BlogStatus, publishedAt: string | null): Promise<void> {
  const { error } = await supabase.from("blog_posts").update({ status, published_at: publishedAt }).eq("id", id);
  fail(error);
}

export async function adminDeletePost(id: string): Promise<void> {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  fail(error);
}
