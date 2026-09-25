import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeDoc } from "../../lib/blog/content.js";
import type { BlogPost, BlogPostSummary, BlogSource, BlogTag } from "../../lib/blog/types.js";
import type { SitemapEntry } from "./html.js";

// Read-only blog queries for Vercel Functions. They use the PUBLIC
// publishable key, so Row Level Security guarantees only live posts can ever
// be read here — no service-role key is involved.

export function createPublicSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Public Supabase configuration is missing.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const LIVE = ["published", "scheduled"];

export async function loadLivePost(
  supabase: SupabaseClient,
  slug: string,
): Promise<{ kind: "post"; post: BlogPost } | { kind: "redirect"; slug: string } | { kind: "not_found" }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "*,category:blog_categories(id,slug,name),post_tags:blog_post_tags(tag:blog_tags(id,slug,name)),sources:blog_post_sources(id,name,url,publisher,position)",
    )
    .eq("slug", slug)
    .in("status", LIVE)
    .lte("published_at", now)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) {
    const row = data as Record<string, unknown> & {
      post_tags?: { tag: BlogTag | null }[];
      sources?: BlogSource[];
    };
    const { post_tags, sources, ...rest } = row;
    return {
      kind: "post",
      post: {
        ...(rest as unknown as BlogPost),
        content: normalizeDoc(row.content),
        tags: (post_tags ?? []).map((pt) => pt.tag).filter((tag): tag is BlogTag => Boolean(tag)),
        sources: sources ?? [],
      },
    };
  }

  const { data: redirect, error: redirectError } = await supabase
    .from("blog_slug_redirects")
    .select("post:blog_posts(slug,status,published_at)")
    .eq("old_slug", slug)
    .maybeSingle();
  if (redirectError) throw new Error(redirectError.message);
  const target = (redirect as unknown as { post: { slug: string; status: string; published_at: string | null } | null } | null)?.post;
  if (target && LIVE.includes(target.status) && target.published_at && new Date(target.published_at) <= new Date(now)) {
    return { kind: "redirect", slug: target.slug };
  }
  return { kind: "not_found" };
}

export async function loadLiveSummaries(supabase: SupabaseClient): Promise<BlogPostSummary[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,title,slug,excerpt,featured_image,featured_image_alt,featured_image_width,featured_image_height,author,status,published_at,last_updated_at,category:blog_categories(id,slug,name)")
    .in("status", LIVE)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as BlogPostSummary[];
}

export async function loadSitemapEntries(supabase: SupabaseClient): Promise<SitemapEntry[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug,published_at,last_updated_at,canonical_url")
    .in("status", LIVE)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []) as SitemapEntry[];
}
