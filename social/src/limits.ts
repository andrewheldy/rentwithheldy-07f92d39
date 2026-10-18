// Platform limits used by validation. Each value was checked against the
// platform's official docs on 2026-10-18; the source is next to it. When a
// platform changes a limit, update it here and the tests that pin it.

export const LIMITS = {
  instagram: {
    // developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media
    captionChars: 2200,
    hashtags: 30,
    carouselMin: 2,
    carouselMax: 10,
    imageMaxBytes: 8 * 1024 * 1024,
    imageMimes: ["image/jpeg"],
    // Feed images: 4:5 (0.8) to 1.91:1.
    feedAspectMin: 0.8,
    feedAspectMax: 1.91,
    videoMaxBytes: 300 * 1024 * 1024,
    storyVideoMaxBytes: 100 * 1024 * 1024,
    videoMimes: ["video/mp4", "video/quicktime"],
    // The daily publishing quota is read live from content_publishing_limit
    // (Meta's pages disagree on 50 vs 100), so it is not pinned here.
  },
  facebook: {
    // Meta does not document a Page post length limit; 63,206 is the
    // long-standing composer limit and only guards against obvious mistakes.
    captionChars: 63206,
  },
  tiktok: {
    // developers.tiktok.com/doc/content-posting-api-reference-direct-post
    titleUtf16: 2200,
    // developers.tiktok.com/doc/content-posting-api-media-transfer-guide
    videoMaxBytes: 4 * 1024 * 1024 * 1024,
    videoMimes: ["video/mp4", "video/quicktime"],
  },
  gbp: {
    // Google's localPosts reference gives no limit; 1500 is the limit the
    // Business Profile UI enforces. Kept conservative.
    summaryChars: 1500,
    imageMimes: ["image/jpeg", "image/png"],
  },
} as const;

export const BANNED_IN_GUEST_COPY = /—/; // em dash
