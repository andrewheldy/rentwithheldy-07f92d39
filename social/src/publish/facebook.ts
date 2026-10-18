// Facebook Page via the Graph API (developers.facebook.com/docs/graph-api/reference/page):
//   photo: POST /{page-id}/photos  { url, caption }       -> { id, post_id }
//   video: POST /{page-id}/videos  { file_url, description } -> { id }
//   link:  POST /{page-id}/feed    { message, link }      -> { id }
//   text:  POST /{page-id}/feed    { message }            -> { id }
// Needs a Page token with pages_manage_posts and pages_read_engagement.

import type { MetaConfig } from "../config.js";
import { requestJson } from "../http.js";
import type { SocialPost } from "../load-posts.js";
import { buildLink } from "../utm.js";
import { bestEffort, irreversible, type PlatformPublisher, type PublisherDeps } from "./types.js";

/** Caption with the UTM'd link swapped in for (or appended after) the plain link. */
export function captionWithLink(caption: string, link: string | null, utmLink: string | null) {
  if (!link || !utmLink) return caption;
  if (caption.includes(link)) return caption.split(link).join(utmLink);
  return `${caption}\n\n${utmLink}`;
}

export function facebookRequest(post: SocialPost): { edge: string; params: Record<string, string> } {
  const type = post.platforms.facebook!.type;
  const utmLink = post.link
    ? buildLink(post.link, { source: "facebook", campaign: post.utmCampaign, content: post.id })
    : null;
  const caption = post.captions.facebook;

  switch (type) {
    case "photo":
      return { edge: "photos", params: { url: post.media[0].publicUrl, caption: captionWithLink(caption, post.link, utmLink) } };
    case "video":
      return {
        edge: "videos",
        params: { file_url: post.media[0].publicUrl, description: captionWithLink(caption, post.link, utmLink) },
      };
    case "link":
      return { edge: "feed", params: { message: caption, link: utmLink! } };
    case "text":
    default:
      return { edge: "feed", params: { message: captionWithLink(caption, post.link, utmLink) } };
  }
}

export function createFacebookPublisher(config: MetaConfig, deps: PublisherDeps): PlatformPublisher {
  const base = `https://graph.facebook.com/${config.graphVersion}`;
  const token = config.pageAccessToken;

  return {
    platform: "facebook",
    notConfiguredReason() {
      if (!config.pageId) return "FB_PAGE_ID is not set";
      if (!token) return "FB_PAGE_ACCESS_TOKEN is not set";
      return null;
    },
    preview(post) {
      const { edge, params } = facebookRequest(post);
      return { endpoint: `POST ${base}/${config.pageId ?? "{FB_PAGE_ID}"}/${edge}`, params };
    },
    async publish(post) {
      const { edge, params } = facebookRequest(post);
      const response = await irreversible(`facebook /${edge}`, () =>
        requestJson(deps.fetch, `${base}/${config.pageId}/${edge}`, {
          method: "POST",
          body: new URLSearchParams({ ...params, access_token: token! }),
        }),
      );
      const id = String(response.post_id ?? response.id);
      const permalink = await bestEffort(
        async () => {
          const { permalink_url: url } = await requestJson(deps.fetch, `${base}/${id}`, {
            query: { fields: "permalink_url", access_token: token! },
          });
          if (!url) return null;
          return String(url).startsWith("http") ? String(url) : `https://www.facebook.com${url}`;
        },
        null,
        deps,
        "facebook permalink lookup",
      );
      return { platformPostId: id, permalink };
    },
  };
}
