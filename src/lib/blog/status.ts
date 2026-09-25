import type { BlogStatus } from "./types.js";

// A post is LIVE (public, indexable, in the sitemap) when it is published or
// scheduled AND its publish date has arrived. This mirrors the RLS policy
// "Public can view live blog posts" in the blog_cms migration, so scheduled
// posts go live on time without a cron job.

interface Publishable {
  status: BlogStatus;
  published_at: string | null;
}

export function isLive(post: Publishable, now: Date = new Date()): boolean {
  if (post.status === "draft" || !post.published_at) return false;
  return new Date(post.published_at).getTime() <= now.getTime();
}

/**
 * What an editor should see in the admin list: a scheduled post whose time
 * has passed is effectively published; a "published" post with a future date
 * is effectively scheduled.
 */
export function effectiveStatus(post: Publishable, now: Date = new Date()): BlogStatus {
  if (post.status === "draft") return "draft";
  return isLive(post, now) ? "published" : "scheduled";
}

/** Only show "Updated" when the edit is meaningfully later than publication. */
export function hasMeaningfulUpdate(
  publishedAt: string | null,
  lastUpdatedAt: string | null,
): boolean {
  if (!publishedAt || !lastUpdatedAt) return false;
  const day = 24 * 60 * 60 * 1000;
  return new Date(lastUpdatedAt).getTime() - new Date(publishedAt).getTime() >= day;
}
