// TikTok Display API: user/info (follower_count needs user.info.stats) and
// video/list (view/like/comment/share counts need video.list).

import { requestJson } from "../http.js";
import type { DailyMetricRow, PostMetricRow } from "../store.js";
import { num, POST_LOOKBACK_DAYS, type AnalyticsDeps, type AnalyticsModule } from "./types.js";

const API = "https://open.tiktokapis.com/v2";
const VIDEO_FIELDS = ["view_count", "like_count", "comment_count", "share_count"];
const USER_FIELDS = ["follower_count", "following_count", "likes_count", "video_count"];

export function createTikTokAnalytics(
  tokens: { accessToken(): Promise<string> } | null,
  notConfigured: string | null,
  deps: AnalyticsDeps,
): AnalyticsModule {
  return {
    platform: "tiktok",
    notConfiguredReason() {
      return notConfigured;
    },
    async collect(range) {
      const token = await tokens!.accessToken();
      const headers = { Authorization: `Bearer ${token}` };
      const daily: DailyMetricRow[] = [];
      const posts: PostMetricRow[] = [];

      const user = await requestJson(deps.fetch, `${API}/user/info/`, { headers, query: { fields: USER_FIELDS.join(",") } });
      for (const field of USER_FIELDS) {
        const value = num(user.data?.user?.[field]);
        if (value !== null) daily.push({ platform: "tiktok", metric: field, date: range.today, value });
      }

      const cutoff = Math.floor((range.now.getTime() - POST_LOOKBACK_DAYS * 86_400_000) / 1000);
      let cursor: number | undefined;
      for (let page = 0; page < 10; page += 1) {
        const response = await requestJson(deps.fetch, `${API}/video/list/`, {
          method: "POST",
          headers,
          query: { fields: ["id", "create_time", ...VIDEO_FIELDS].join(",") },
          body: { max_count: 20, ...(cursor ? { cursor } : {}) },
        });
        const videos = response.data?.videos ?? [];
        let reachedCutoff = false;
        for (const video of videos) {
          if (num(video.create_time) !== null && video.create_time < cutoff) {
            reachedCutoff = true;
            continue;
          }
          for (const field of VIDEO_FIELDS) {
            const value = num(video[field]);
            if (value !== null) {
              posts.push({ platform: "tiktok", platform_post_id: String(video.id), metric: field, captured_on: range.today, value });
            }
          }
        }
        if (reachedCutoff || !response.data?.has_more) break;
        cursor = response.data.cursor;
      }
      return { daily, posts, events: [] };
    },
  };
}
