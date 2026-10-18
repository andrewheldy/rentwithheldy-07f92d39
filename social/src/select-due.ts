// Decides which (post, platform) pairs a publisher run should try. Pure, so
// the rules are easy to test; the atomic claim in the store makes the final
// call (backoff, concurrent runs).

import type { Platform } from "./config.js";
import type { SocialPost } from "./load-posts.js";
import type { PublicationRow } from "./store.js";

export const STALE_HOURS = 48;
/** Stale posts are reported for a week, then dropped from the report. */
export const STALE_REPORT_DAYS = 7;
export const MAX_ATTEMPTS = 3;
export const STUCK_AFTER_MS = 60 * 60_000;

export interface Pair {
  post: SocialPost;
  platform: Platform;
}

export interface Selection {
  due: Pair[];
  /** Approved but more than 48h overdue: logged, never auto-published. */
  stale: Pair[];
  /** Published, but the post file changed afterwards: logged, not re-posted. */
  editedAfterPublish: Array<Pair & { publication: PublicationRow }>;
  /** Failed MAX_ATTEMPTS times: needs the owner. */
  exhausted: Array<Pair & { publication: PublicationRow }>;
  /** "publishing" for over an hour: the run died mid-publish; check by hand. */
  stuck: Array<Pair & { publication: PublicationRow }>;
}

export interface SelectOptions {
  now: Date;
  /** workflow_dispatch post_id: only this post, and the stale window is lifted. */
  postId?: string | null;
  maxAttempts?: number;
}

export function selectDue(posts: SocialPost[], publications: PublicationRow[], options: SelectOptions): Selection {
  const { now, postId = null, maxAttempts = MAX_ATTEMPTS } = options;
  const byPair = new Map(publications.map((row) => [`${row.post_id}:${row.platform}`, row]));
  const selection: Selection = { due: [], stale: [], editedAfterPublish: [], exhausted: [], stuck: [] };
  const staleBefore = now.getTime() - STALE_HOURS * 3_600_000;
  const forgottenBefore = now.getTime() - STALE_REPORT_DAYS * 86_400_000;

  for (const post of posts) {
    if (post.isTemplate || post.status !== "approved") continue;
    if (postId && post.id !== postId) continue;
    if (post.scheduledAt.getTime() > now.getTime()) continue;

    for (const platform of post.platformList) {
      const pair = { post, platform };
      const publication = byPair.get(`${post.id}:${platform}`);

      if (publication?.state === "published") {
        if (publication.content_hash && publication.content_hash !== post.contentHash) {
          selection.editedAfterPublish.push({ ...pair, publication });
        }
        continue;
      }
      if (publication?.state === "skipped") continue;
      if (publication?.state === "publishing") {
        if (now.getTime() - Date.parse(publication.updated_at) > STUCK_AFTER_MS) {
          selection.stuck.push({ ...pair, publication });
        }
        continue;
      }
      if (publication?.state === "failed" && publication.attempts >= maxAttempts) {
        selection.exhausted.push({ ...pair, publication });
        continue;
      }
      if (!postId && post.scheduledAt.getTime() < staleBefore) {
        if (post.scheduledAt.getTime() >= forgottenBefore) selection.stale.push(pair);
        continue;
      }
      selection.due.push(pair);
    }
  }
  return selection;
}
