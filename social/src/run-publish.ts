// One publisher run: select due pairs, claim each atomically, then dry-run
// (log the payload) or publish. Safe by construction:
//   - only approved posts from the checked-out branch (the workflow forces
//     dry-run off the default branch), due within the last 48h
//   - live publishing needs DRY_RUN=false AND a durable store (Supabase)
//   - unconfigured platforms are skipped without touching the database

import type { Platform, SocialConfig } from "./config.js";
import type { FetchLike } from "./http.js";
import type { Issue, SocialPost } from "./load-posts.js";
import { errorMessage, redactValue } from "./log.js";
import { MAX_ATTEMPTS, selectDue, type Pair } from "./select-due.js";
import type { Store } from "./store.js";
import { markdownTable } from "./summary.js";
import { buildLink } from "./utm.js";
import { AmbiguousPublishError, type PlatformPublisher } from "./publish/types.js";

export type Outcome =
  | "published"
  | "dry_run"
  | "preview"
  | "failed"
  | "failed_final"
  | "skipped_not_configured"
  | "not_claimable"
  | "waiting_for_media";

export interface RunResult {
  post: string;
  platform: Platform;
  outcome: Outcome;
  detail: string;
  permalink?: string | null;
}

export interface RunPublishDeps {
  config: SocialConfig;
  store: Store;
  publishers: Record<Platform, PlatformPublisher>;
  posts: SocialPost[];
  issues: Issue[];
  now: Date;
  postId?: string | null;
  /** HEAD check that media is publicly reachable (deployed). */
  checkUrl: (url: string) => Promise<boolean>;
  log: { info(message: string): void; warn(message: string): void; error(message: string): void };
  fetch: FetchLike;
}

export interface RunPublishReport {
  results: RunResult[];
  summary: string;
  alertLines: string[];
  exitCode: number;
}

export async function defaultCheckUrl(fetchImpl: FetchLike, url: string): Promise<boolean> {
  try {
    const response = await fetchImpl(url, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(15_000) });
    return response.status === 200;
  } catch {
    return false;
  }
}

export async function runPublish(deps: RunPublishDeps): Promise<RunPublishReport> {
  const { config, store, publishers, now, log } = deps;
  const results: RunResult[] = [];
  const alertLines: string[] = [];
  const live = !config.dryRun;
  const postId = deps.postId?.trim() || null;

  log.info(`social-publish: ${live ? "LIVE" : "DRY RUN"} (${config.dryRunReason}); store=${store.durable ? "supabase" : "memory"}`);
  // Draft warnings belong in the PR check, not in a log every 15 minutes.
  for (const issue of deps.issues) if (issue.level === "error") log.error(`${issue.file}: ${issue.message}`);
  const readiness = Object.values(publishers).map((publisher) => {
    const reason = publisher.notConfiguredReason();
    log.info(`${publisher.platform}: ${reason ? `skipped: not configured (${reason})` : "configured"}`);
    return [publisher.platform, reason ? `skipped: not configured (${reason})` : "configured"];
  });

  const header = `## Social publisher: ${live ? "LIVE" : "dry run"}\n\nMode: ${config.dryRunReason}. Store: ${
    store.durable ? "Supabase" : "in-memory (Supabase not configured)"
  }.${postId ? ` Manual run for post \`${postId}\`.` : ""}\n`;

  if (live && !store.durable) {
    const message = "skipped: Supabase is not configured; refusing to publish live without the once-only publishing store";
    log.warn(message);
    return { results, summary: `${header}\n${message}\n`, alertLines, exitCode: 0 };
  }

  const publishable = deps.posts.filter((post) => !post.isTemplate);
  let publications;
  try {
    await store.upsertPosts(publishable);
    publications = await store.listPublications(publishable.map((post) => post.id));
  } catch (error) {
    // Usually a paused Supabase project. Fail the job only when it is
    // actually blocking a due post, so idle runs don't email every 15 minutes.
    const blocked = selectDue(publishable, [], { now, postId }).due;
    const message = `Supabase is unreachable (${errorMessage(error)}); nothing was published. Restore the project in the Supabase dashboard.`;
    (blocked.length ? log.error : log.warn)(message);
    if (blocked.length && live) alertLines.push(`${blocked.length} due post/platform pair(s) blocked: ${message}`);
    return { results, summary: `${header}\n${message}\n`, alertLines, exitCode: blocked.length ? 1 : 0 };
  }
  const selection = selectDue(publishable, publications, { now, postId, maxAttempts: MAX_ATTEMPTS });
  if (postId && !publishable.some((post) => post.id === postId)) {
    log.warn(`post_id "${postId}" was not found among valid post files`);
  }

  const preview = !live && Boolean(postId);
  for (const { post, platform } of selection.due as Pair[]) {
    const publisher = publishers[platform];
    const label = `${post.id} → ${platform}`;
    const reason = publisher.notConfiguredReason();
    if (reason) {
      log.info(`${label}: skipped: not configured (${reason})`);
      results.push({ post: post.id, platform, outcome: "skipped_not_configured", detail: reason });
      continue;
    }

    const needsUrls = !(platform === "facebook" && ["link", "text"].includes(post.platforms.facebook!.type));
    if (needsUrls) {
      const unreachable: string[] = [];
      for (const item of post.media) if (!(await deps.checkUrl(item.publicUrl))) unreachable.push(item.publicUrl);
      if (unreachable.length) {
        const detail = `media not reachable yet (deploy pending?): ${unreachable.join(", ")}`;
        if (live) {
          // Not claimed, so no attempt is used; the next run checks again.
          log.warn(`${label}: ${detail}`);
          results.push({ post: post.id, platform, outcome: "waiting_for_media", detail });
          continue;
        }
        log.warn(`${label}: ${detail} (a live run would wait)`);
      }
    }

    if (preview) {
      log.info(`${label}: preview payload ${JSON.stringify(redactValue(publisher.preview(post)), null, 2)}`);
      results.push({ post: post.id, platform, outcome: "preview", detail: "manual dry run; nothing recorded" });
      continue;
    }

    const claimed = await store.claim(post.id, platform, { live, contentHash: post.contentHash, maxAttempts: MAX_ATTEMPTS });
    if (!claimed) {
      const detail = live ? "already handled, in progress, or waiting for retry backoff" : "already previewed in an earlier dry run";
      log.info(`${label}: not claimed (${detail})`);
      results.push({ post: post.id, platform, outcome: "not_claimable", detail });
      continue;
    }

    if (!live) {
      try {
        const payload = redactValue(publisher.preview(post));
        log.info(`${label}: DRY RUN payload ${JSON.stringify(payload, null, 2)}`);
        await store.markDryRun(post.id, platform);
        results.push({ post: post.id, platform, outcome: "dry_run", detail: "payload logged" });
      } catch (error) {
        const message = errorMessage(error);
        await store.markFailed(post.id, platform, message);
        results.push({ post: post.id, platform, outcome: "failed", detail: message });
      }
      continue;
    }

    try {
      log.info(`${label}: publishing (attempt ${claimed.attempts}/${MAX_ATTEMPTS})`);
      const published = await publisher.publish(post);
      await store.markPublished(post.id, platform, published);
      log.info(`${label}: published ${published.permalink ?? published.platformPostId}`);
      results.push({
        post: post.id,
        platform,
        outcome: "published",
        detail: published.note ?? "",
        permalink: published.permalink,
      });
    } catch (error) {
      const message = errorMessage(error);
      const final = error instanceof AmbiguousPublishError || claimed.attempts >= MAX_ATTEMPTS;
      await store.markFailed(post.id, platform, message, error instanceof AmbiguousPublishError ? MAX_ATTEMPTS : undefined);
      log.error(`${label}: ${final ? "FAILED (no more retries)" : "failed, will retry"}: ${message}`);
      results.push({ post: post.id, platform, outcome: final ? "failed_final" : "failed", detail: message });
      if (final) alertLines.push(`${label}: ${message}`);
    }
  }

  // Report everything the owner may need to act on.
  for (const { post, platform } of selection.stale) {
    log.warn(`${post.id} → ${platform}: stale (scheduled ${post.scheduledAtRaw}, over 48h ago); not auto-published`);
  }
  for (const { post, platform } of selection.editedAfterPublish) {
    log.warn(`${post.id} → ${platform}: post file changed after it was published; not re-posted`);
  }
  for (const { post, platform, publication } of selection.stuck) {
    log.warn(`${post.id} → ${platform}: stuck in "publishing" since ${publication.updated_at}; check the account by hand`);
  }

  const linkInBio = publishable
    .filter((post) => post.link && post.status === "approved")
    .flatMap((post) =>
      (["instagram", "tiktok"] as const)
        .filter((platform) => post.platforms[platform])
        .map((platform) => [post.id, platform, buildLink(post.link!, { source: platform, campaign: post.utmCampaign, content: post.id })]),
    )
    .filter(([id]) => selection.due.some((pair) => pair.post.id === id));

  const summary = [
    header,
    "### Platforms",
    markdownTable(["Platform", "Status"], readiness),
    "### This run",
    markdownTable(
      ["Post", "Platform", "Result", "Permalink / detail"],
      results.map((result) => [result.post, result.platform, result.outcome, result.permalink ?? result.detail]),
    ),
    "### Needs attention",
    markdownTable(
      ["Post", "Platform", "Issue"],
      [
        ...selection.exhausted.map(({ post, platform, publication }) => [post.id, platform, `failed ${publication.attempts}x: ${publication.last_error ?? ""}`]),
        ...selection.stuck.map(({ post, platform }) => [post.id, platform, "stuck in publishing"]),
        ...selection.editedAfterPublish.map(({ post, platform }) => [post.id, platform, "edited after publish (not re-posted)"]),
        ...selection.stale.map(({ post, platform }) => [post.id, platform, "stale: over 48h late, not auto-published"]),
        ...deps.issues.filter((issue) => issue.level === "error").map((issue) => [issue.file, "-", issue.message]),
      ],
    ),
    linkInBio.length ? "### Link-in-bio URLs (Instagram/TikTok captions cannot link)" : "",
    linkInBio.length ? markdownTable(["Post", "Platform", "UTM link"], linkInBio) : "",
  ]
    .filter(Boolean)
    .join("\n");

  const exitCode = results.some((result) => result.outcome === "failed_final") ? 1 : 0;
  return { results, summary, alertLines, exitCode };
}
