// TikTok Content Posting API, Direct Post
// (developers.tiktok.com/doc/content-posting-api-reference-direct-post):
//   POST /v2/post/publish/creator_info/query/  -> allowed privacy levels
//   POST /v2/post/publish/video/init/          -> publish_id (+ upload_url)
//   PUT  upload_url (FILE_UPLOAD only, chunked)
//   POST /v2/post/publish/status/fetch/        until PUBLISH_COMPLETE / FAILED
//
// Until TikTok audits the app, only SELF_ONLY (private) posts are allowed, so
// privacy is forced to SELF_ONLY unless TIKTOK_AUDITED=true.

import { open } from "node:fs/promises";
import type { TikTokConfig } from "../config.js";
import { ApiError, requestJson } from "../http.js";
import type { SocialPost } from "../load-posts.js";
import { bestEffort, irreversible, AmbiguousPublishError, type PlatformPublisher, type PublisherDeps } from "./types.js";

const API = "https://open.tiktokapis.com/v2";
const POLL_INTERVAL_MS = 10_000;
const POLL_TIMEOUT_MS = 10 * 60_000;
const MIN_CHUNK = 5 * 1024 * 1024;
const CHUNK = 10 * 1024 * 1024;

export function resolvePrivacy(requested: string, audited: boolean) {
  if (audited) return { privacy: requested, forced: false };
  return { privacy: "SELF_ONLY", forced: requested !== "SELF_ONLY" };
}

/** Chunk plan per the media transfer guide: 5–64 MB chunks, last chunk takes the remainder. */
export function chunkPlan(size: number) {
  if (size < MIN_CHUNK) return { chunkSize: size, totalChunks: 1 };
  const totalChunks = Math.max(1, Math.floor(size / CHUNK));
  return { chunkSize: CHUNK, totalChunks };
}

export function tiktokPostInfo(post: SocialPost, audited: boolean) {
  const settings = post.platforms.tiktok!;
  const { privacy } = resolvePrivacy(settings.privacy, audited);
  return {
    title: post.captions.tiktok,
    privacy_level: privacy,
    disable_comment: settings.disable_comment,
    disable_duet: settings.disable_duet,
    disable_stitch: settings.disable_stitch,
    brand_content_toggle: false,
    brand_organic_toggle: false,
    is_aigc: false,
  };
}

export function createTikTokPublisher(
  config: TikTokConfig | null,
  tokens: { accessToken(): Promise<string> } | null,
  canStoreTokens: boolean,
  deps: PublisherDeps,
): PlatformPublisher {
  const call = async (path: string, body: unknown = undefined) => {
    const token = await tokens!.accessToken();
    const response = await requestJson(deps.fetch, `${API}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" },
      body: body ?? "",
    });
    if (response?.error?.code && response.error.code !== "ok") {
      // A definitive API answer, not an unclear outcome.
      throw new ApiError(`tiktok ${path}: ${response.error.code} ${response.error.message ?? ""}`.trim(), 400, response);
    }
    return response.data ?? {};
  };

  return {
    platform: "tiktok",
    notConfiguredReason() {
      if (!config || !tokens) return "TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET are not set";
      if (!config.bootstrapRefreshToken && !canStoreTokens) return "TIKTOK_REFRESH_TOKEN is not set";
      return null;
    },
    preview(post) {
      const audited = config?.audited ?? false;
      const { forced } = resolvePrivacy(post.platforms.tiktok!.privacy, audited);
      const video = post.media[0];
      const pull = (config?.pullFromUrl ?? false) || !video.localPath;
      return {
        endpoint: `POST ${API}/post/publish/video/init/`,
        post_info: tiktokPostInfo(post, audited),
        source_info: pull
          ? { source: "PULL_FROM_URL", video_url: video.publicUrl }
          : (() => {
              const { chunkSize, totalChunks } = chunkPlan(video.bytes ?? 0);
              return { source: "FILE_UPLOAD", video_size: video.bytes, chunk_size: chunkSize, total_chunk_count: totalChunks };
            })(),
        note: forced ? "privacy forced to SELF_ONLY (TIKTOK_AUDITED is not true)" : undefined,
      };
    },
    async publish(post) {
      const audited = config!.audited;
      const settings = post.platforms.tiktok!;
      const { privacy, forced } = resolvePrivacy(settings.privacy, audited);
      if (forced) deps.log.info(`tiktok: ${post.id} privacy forced to SELF_ONLY (TIKTOK_AUDITED is not true)`);

      const creator = await call("/post/publish/creator_info/query/");
      const options: string[] = creator.privacy_level_options ?? [];
      if (options.length && !options.includes(privacy)) {
        throw new Error(`tiktok: privacy ${privacy} is not allowed for this account (allowed: ${options.join(", ")})`);
      }
      const postInfo = {
        ...tiktokPostInfo(post, audited),
        disable_comment: settings.disable_comment || Boolean(creator.comment_disabled),
        disable_duet: settings.disable_duet || Boolean(creator.duet_disabled),
        disable_stitch: settings.disable_stitch || Boolean(creator.stitch_disabled),
      };

      const video = post.media[0];
      const pull = config!.pullFromUrl || !video.localPath;
      let publishId: string;

      if (pull) {
        const data = await irreversible("tiktok video/init", () =>
          call("/post/publish/video/init/", {
            post_info: postInfo,
            source_info: { source: "PULL_FROM_URL", video_url: video.publicUrl },
          }),
        );
        publishId = data.publish_id;
      } else {
        const size = video.bytes!;
        const { chunkSize, totalChunks } = chunkPlan(size);
        // Nothing is posted until the upload completes, so init is retryable.
        const data = await call("/post/publish/video/init/", {
          post_info: postInfo,
          source_info: { source: "FILE_UPLOAD", video_size: size, chunk_size: chunkSize, total_chunk_count: totalChunks },
        });
        publishId = data.publish_id;
        const handle = await open(video.localPath!, "r");
        try {
          for (let index = 0; index < totalChunks; index += 1) {
            const first = index * chunkSize;
            const last = index === totalChunks - 1 ? size - 1 : first + chunkSize - 1;
            const buffer = Buffer.alloc(last - first + 1);
            await handle.read(buffer, 0, buffer.length, first);
            const upload = () =>
              deps.fetch(data.upload_url, {
                method: "PUT",
                headers: {
                  "Content-Type": video.mime,
                  "Content-Length": String(buffer.length),
                  "Content-Range": `bytes ${first}-${last}/${size}`,
                },
                body: buffer,
              });
            const response = index === totalChunks - 1 ? await irreversible("tiktok final chunk", upload) : await upload();
            if (!response.ok && response.status !== 206) {
              throw new Error(`tiktok chunk ${index + 1}/${totalChunks} upload failed: HTTP ${response.status}`);
            }
          }
        } finally {
          await handle.close();
        }
      }

      const deadline = deps.now().getTime() + POLL_TIMEOUT_MS;
      for (;;) {
        const status = await bestEffort(() => call("/post/publish/status/fetch/", { publish_id: publishId }), null, deps, "tiktok status");
        if (status?.status === "PUBLISH_COMPLETE") {
          const publicId = status.publicaly_available_post_id?.[0];
          const permalink =
            publicId && creator.creator_username ? `https://www.tiktok.com/@${creator.creator_username}/video/${publicId}` : null;
          return {
            platformPostId: publicId ? String(publicId) : publishId,
            permalink,
            note: privacy === "SELF_ONLY" ? "posted privately (SELF_ONLY)" : undefined,
          };
        }
        if (status?.status === "FAILED") throw new Error(`tiktok publish failed: ${status.fail_reason ?? "unknown reason"}`);
        if (deps.now().getTime() > deadline) {
          throw new AmbiguousPublishError(
            `tiktok: ${publishId} still ${status?.status ?? "unknown"} after 10 minutes. It may still post. Check TikTok before resetting this row.`,
          );
        }
        await deps.sleep(POLL_INTERVAL_MS);
      }
    },
  };
}
