// Instagram insights (metric names per Meta's IG User / IG Media insights
// references, checked 2026-10-18; impressions, profile_views and
// website_clicks are gone, profile_links_taps replaces link taps).

import type { MetaConfig } from "../config.js";
import { dayBounds } from "../dates.js";
import { requestJson } from "../http.js";
import type { DailyMetricRow, PostMetricRow } from "../store.js";
import { num, POST_LOOKBACK_DAYS, type AnalyticsDeps, type AnalyticsModule } from "./types.js";

export const IG_ACCOUNT_METRICS = [
  "reach",
  "views",
  "accounts_engaged",
  "total_interactions",
  "profile_links_taps",
  "follows_and_unfollows",
];
export const IG_MEDIA_METRICS: Record<string, string[]> = {
  FEED: ["views", "reach", "likes", "comments", "saved", "shares", "total_interactions"],
  REELS: ["views", "reach", "likes", "comments", "saved", "shares", "total_interactions"],
  STORY: ["views", "reach", "replies", "shares"],
};

export function createInstagramAnalytics(config: MetaConfig, deps: AnalyticsDeps): AnalyticsModule {
  const base = `https://graph.facebook.com/${config.graphVersion}`;
  const get = (path: string, query: Record<string, string | number>) =>
    requestJson(deps.fetch, `${base}${path}`, { query: { ...query, access_token: config.igAccessToken! } });

  return {
    platform: "instagram",
    notConfiguredReason() {
      if (!config.igUserId) return "IG_USER_ID is not set";
      if (!config.igAccessToken) return "IG_ACCESS_TOKEN (or FB_PAGE_ACCESS_TOKEN) is not set";
      return null;
    },
    async collect(range) {
      const userId = config.igUserId!;
      const daily: DailyMetricRow[] = [];
      const posts: PostMetricRow[] = [];

      for (const day of range.days) {
        const { since, until } = dayBounds(day, range.timeZone);
        const response = await get(`/${userId}/insights`, {
          metric: IG_ACCOUNT_METRICS.join(","),
          metric_type: "total_value",
          period: "day",
          since,
          until,
        });
        for (const metric of response.data ?? []) {
          const value = num(metric.total_value?.value);
          if (value !== null) daily.push({ platform: "instagram", metric: metric.name, date: day, value });
        }
      }

      const account = await get(`/${userId}`, { fields: "followers_count,media_count" });
      for (const field of ["followers_count", "media_count"]) {
        const value = num(account[field]);
        if (value !== null) daily.push({ platform: "instagram", metric: field, date: range.today, value });
      }

      const cutoff = range.now.getTime() - POST_LOOKBACK_DAYS * 86_400_000;
      let page = await get(`/${userId}/media`, { fields: "id,timestamp,media_product_type", limit: 50 });
      const media: Array<{ id: string; type: string }> = [];
      for (;;) {
        let reachedCutoff = false;
        for (const item of page.data ?? []) {
          if (Date.parse(item.timestamp) < cutoff) {
            reachedCutoff = true;
            break;
          }
          media.push({ id: item.id, type: item.media_product_type ?? "FEED" });
        }
        const next = page.paging?.next;
        if (reachedCutoff || !next) break;
        page = await requestJson(deps.fetch, next);
      }

      for (const item of media) {
        const metrics = IG_MEDIA_METRICS[item.type] ?? IG_MEDIA_METRICS.FEED;
        try {
          const response = await get(`/${item.id}/insights`, { metric: metrics.join(",") });
          for (const metric of response.data ?? []) {
            const value = num(metric.values?.[0]?.value ?? metric.total_value?.value);
            if (value !== null) {
              posts.push({ platform: "instagram", platform_post_id: item.id, metric: metric.name, captured_on: range.today, value });
            }
          }
        } catch (error) {
          deps.log.warn(`instagram insights for media ${item.id}: ${error instanceof Error ? error.message : error}`);
        }
      }
      return { daily, posts, events: [] };
    },
  };
}
