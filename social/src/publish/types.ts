import type { Platform } from "../config.js";
import type { FetchLike } from "../http.js";
import { ApiError } from "../http.js";
import type { SocialPost } from "../load-posts.js";

export interface PublishResult {
  platformPostId: string;
  permalink: string | null;
  /** Extra line for the job summary (e.g. "posted privately: TikTok app not audited"). */
  note?: string;
}

export interface PublisherDeps {
  fetch: FetchLike;
  sleep: (ms: number) => Promise<void>;
  now: () => Date;
  log: { info(message: string): void; warn(message: string): void };
}

export interface PlatformPublisher {
  readonly platform: Platform;
  /** Why this platform is skipped this run, or null when it is ready. */
  notConfiguredReason(): string | null;
  /** The exact request(s) a live run would send, without secrets. No network. */
  preview(post: SocialPost): unknown;
  publish(post: SocialPost): Promise<PublishResult>;
}

/**
 * The irreversible request (media_publish, /photos, video/init, localPosts)
 * may or may not have gone through. Retrying could double-post, so the pair
 * is marked failed with no retries left and the owner checks the account.
 */
export class AmbiguousPublishError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AmbiguousPublishError";
  }
}

/** Runs the one call that creates a public post; maps unclear outcomes. */
export async function irreversible<T>(label: string, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    if (error instanceof ApiError && error.status < 500) throw error;
    const reason = error instanceof Error ? error.message : String(error);
    throw new AmbiguousPublishError(
      `${label}: outcome unknown (${reason}). It may have posted. Check the account before resetting this row.`,
    );
  }
}

/** Follow-up reads after publishing must never turn a success into a retry. */
export async function bestEffort<T>(call: () => Promise<T>, fallback: T, deps: PublisherDeps, label: string): Promise<T> {
  try {
    return await call();
  } catch (error) {
    deps.log.warn(`${label}: ${error instanceof Error ? error.message : error}`);
    return fallback;
  }
}
