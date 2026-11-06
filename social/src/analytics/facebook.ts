// Facebook Page insights. page_impressions/post_impressions were deprecated
// on 2025-11-15; the *_media_view metrics replace them.

import type { MetaConfig } from "../config.js";
import { dayBounds } from "../dates.js";
import { requestJson } from "../http.js";
import type { DailyMetricRow, PostMetricRow } from "../store.js";
import { num, POST_LOOKBACK_DAYS, type AnalyticsDeps, type AnalyticsModule } from "./types.js";

export const FB_PAGE_METRICS = ["page_views_total", "page_post_engagements", "page_follows", "page_daily_follows_unique", "page_media_view"];
export const FB_POST_METRICS = ["post_media_view", "post_clicks", "post_reactions_by_type_total"];

const reactionTotal = (value: unknown) =>
  value && typeof value === "object" ? Object.values(value as Record<string, number>).reduce((sum, count) => sum + (num(count) ?? 0), 0) : num(value);

export function createFacebookAnalytics(config: MetaConfig, deps: AnalyticsDeps): AnalyticsModule {
  const base = `https://graph.facebook.com/${config.graphVersion}`;
  const get = (path: string, query: Record<string, string | number>) =>
    requestJson(deps.fetch, `${base}${path}`, { query: { ...query, access_token: config.pageAccessToken! } });

  return {
    platform: "facebook",
    notConfiguredReason() {
      if (!config.pageId) return "FB_PAGE_ID is not set";
      if (!config.pageAccessToken) return "FB_PAGE_ACCESS_TOKEN is not set";
      return null;
    },
    async collect(range) {
      const pageId = config.pageId!;
      const daily: DailyMetricRow[] = [];
      const posts: PostMetricRow[] = [];

      const since = dayBounds(range.days[0], range.timeZone).since;
      const until = dayBounds(range.days[range.days.length - 1], range.timeZone).until;
      const response = await get(`/${pageId}/insights`, { metric: FB_PAGE_METRICS.join(","), period: "day", since, until });
      for (const metric of response.data ?? []) {
        for (const point of metric.values ?? []) {
          const value = num(point.value);
          // end_time marks the end of the day the value covers.
          const date = new Date(Date.parse(point.end_time) - 86_400_000).toISOString().slice(0, 10);
          if (value !== null && range.days.includes(date)) daily.push({ platform: "facebook", metric: metric.name, date, value });
        }
      }

      const page = await get(`/${pageId}`, { fields: "followers_count" });
      const followers = num(page.followers_count);
      if (followers !== null) daily.push({ platform: "facebook", metric: "followers_count", date: range.today, value: followers });

      const postsSince = Math.floor((range.now.getTime() - POST_LOOKBACK_DAYS * 86_400_000) / 1000);
      let list = await get(`/${pageId}/posts`, { fields: "id,created_time", since: postsSince, limit: 50 });
      const ids: string[] = [];
      for (;;) {
        ids.push(...(list.data ?? []).map((item: { id: string }) => item.id));
        if (!list.paging?.next) break;
        list = await requestJson(deps.fetch, list.paging.next);
      }

      for (const id of ids) {
        try {
          const insights = await get(`/${id}/insights`, { metric: FB_POST_METRICS.join(",") });
          for (const metric of insights.data ?? []) {
            const raw = metric.values?.[0]?.value;
            const name = metric.name === "post_reactions_by_type_total" ? "post_reactions_total" : metric.name;
            const value = metric.name === "post_reactions_by_type_total" ? reactionTotal(raw) : num(raw);
            if (value !== null) posts.push({ platform: "facebook", platform_post_id: id, metric: name, captured_on: range.today, value });
          }
        } catch (error) {
          deps.log.warn(`facebook insights for post ${id}: ${error instanceof Error ? error.message : error}`);
        }
      }
      return { daily, posts, events: [] };
    },
  };
}
