// Instagram via "Instagram API with Facebook Login" (graph.facebook.com), so
// one Meta app and one Page token cover both Instagram and the Facebook Page.
// Flow (developers.facebook.com/docs/instagram-platform/content-publishing):
//   POST /{ig-user-id}/media           -> container id
//   GET  /{container}?fields=status_code until FINISHED (video, carousel)
//   POST /{ig-user-id}/media_publish   -> media id
//   GET  /{media-id}?fields=permalink

import type { MetaConfig } from "../config.js";
import { requestJson } from "../http.js";
import type { SocialPost } from "../load-posts.js";
import type { MediaItem } from "../media.js";
import { bestEffort, irreversible, type PlatformPublisher, type PublisherDeps } from "./types.js";

type Params = Record<string, string>;

const POLL_INTERVAL_MS = 15_000;
const POLL_TIMEOUT_MS = 10 * 60_000;

export function instagramContainers(post: SocialPost): { children: Params[]; main: Params } {
  const settings = post.platforms.instagram!;
  const caption = post.captions.instagram;
  const mediaParams = (item: MediaItem): Params =>
    item.kind === "image" ? { image_url: item.publicUrl } : { video_url: item.publicUrl };

  switch (settings.type) {
    case "carousel":
      return {
        children: post.media.map((item) => ({
          is_carousel_item: "true",
          ...(item.kind === "video" ? { media_type: "VIDEO" } : {}),
          ...mediaParams(item),
        })),
        main: { media_type: "CAROUSEL", caption },
      };
    case "story":
      // Stories have no caption field in the API.
      return { children: [], main: { media_type: "STORIES", ...mediaParams(post.media[0]) } };
    case "reel":
      return {
        children: [],
        main: {
          media_type: "REELS",
          video_url: post.media[0].publicUrl,
          caption,
          share_to_feed: String(settings.share_to_feed ?? true),
        },
      };
    case "feed":
    default: {
      const item = post.media[0];
      // Feed video is published as a Reel shared to the feed.
      return item.kind === "video"
        ? { children: [], main: { media_type: "REELS", video_url: item.publicUrl, caption, share_to_feed: "true" } }
        : { children: [], main: { image_url: item.publicUrl, caption } };
    }
  }
}

export function createInstagramPublisher(config: MetaConfig, deps: PublisherDeps): PlatformPublisher {
  const base = `https://graph.facebook.com/${config.graphVersion}`;
  const token = config.igAccessToken;

  const post = (path: string, params: Params) =>
    requestJson(deps.fetch, `${base}${path}`, {
      method: "POST",
      body: new URLSearchParams({ ...params, access_token: token! }),
    });
  const get = (path: string, fields: string) =>
    requestJson(deps.fetch, `${base}${path}`, { query: { fields, access_token: token! } });

  async function waitUntilFinished(containerId: string) {
    const deadline = deps.now().getTime() + POLL_TIMEOUT_MS;
    for (;;) {
      const { status_code: status } = await get(`/${containerId}`, "status_code");
      if (status === "FINISHED") return;
      if (status === "ERROR" || status === "EXPIRED") throw new Error(`instagram container ${containerId} ${status}`);
      if (deps.now().getTime() > deadline) throw new Error(`instagram container ${containerId} still ${status} after 10 minutes`);
      await deps.sleep(POLL_INTERVAL_MS);
    }
  }

  return {
    platform: "instagram",
    notConfiguredReason() {
      if (!config.igUserId) return "IG_USER_ID is not set";
      if (!token) return "IG_ACCESS_TOKEN (or FB_PAGE_ACCESS_TOKEN) is not set";
      return null;
    },
    preview(socialPost) {
      const { children, main } = instagramContainers(socialPost);
      return {
        endpoint: `POST ${base}/${config.igUserId ?? "{IG_USER_ID}"}/media`,
        children,
        container: children.length ? { ...main, children: "<child container ids>" } : main,
        then: `POST ${base}/${config.igUserId ?? "{IG_USER_ID}"}/media_publish`,
      };
    },
    async publish(socialPost) {
      const userId = config.igUserId!;

      // Read the live quota (Meta's docs disagree on 50 vs 100 per 24h).
      const limit = await bestEffort(
        () => get(`/${userId}/content_publishing_limit`, "quota_usage,config"),
        null,
        deps,
        "instagram quota check",
      );
      const usage = limit?.data?.[0]?.quota_usage;
      const total = limit?.data?.[0]?.config?.quota_total;
      if (typeof usage === "number" && typeof total === "number" && usage >= total) {
        throw new Error(`instagram publishing quota reached (${usage}/${total} in 24h)`);
      }

      const { children, main } = instagramContainers(socialPost);
      const childIds: string[] = [];
      for (const child of children) {
        const { id } = await post(`/${userId}/media`, child);
        childIds.push(id);
      }
      for (const [index, id] of childIds.entries()) {
        if (socialPost.media[index].kind === "video") await waitUntilFinished(id);
      }

      const params = childIds.length ? { ...main, children: childIds.join(",") } : main;
      const { id: containerId } = await post(`/${userId}/media`, params);
      if (main.media_type === "REELS" || main.video_url || childIds.length) await waitUntilFinished(containerId);

      const { id: mediaId } = await irreversible("instagram media_publish", () =>
        post(`/${userId}/media_publish`, { creation_id: containerId }),
      );
      const permalink = await bestEffort(
        async () => (await get(`/${mediaId}`, "permalink")).permalink ?? null,
        null,
        deps,
        "instagram permalink lookup",
      );
      return { platformPostId: String(mediaId), permalink };
    },
  };
}
