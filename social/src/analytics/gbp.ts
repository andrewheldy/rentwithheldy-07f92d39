// Google Business Profile: Performance API daily metrics, monthly search
// keywords, and v4 reviews (summary metrics + new reviews into social_events
// so replies can be drafted for approval).

import type { GbpConfig } from "../config.js";
import { addDays } from "../dates.js";
import { requestJson } from "../http.js";
import type { DailyMetricRow, PostMetricRow, SocialEventRow } from "../store.js";
import { tagEvent } from "../webhook.js";
import { num, type AnalyticsDeps, type AnalyticsModule } from "./types.js";

export const GBP_DAILY_METRICS = [
  "CALL_CLICKS",
  "WEBSITE_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS",
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
];
// Google's daily metrics lag by a few days, so every run re-reads a week.
const GBP_LAG_DAYS = 7;
const STARS: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

const dateParts = (day: string, prefix: string) => {
  const [year, month, dayOfMonth] = day.split("-").map(Number);
  return { [`${prefix}.year`]: year, [`${prefix}.month`]: month, [`${prefix}.day`]: dayOfMonth };
};

export function createGbpAnalytics(
  config: GbpConfig | null,
  enabledFlag: boolean,
  tokens: { accessToken(): Promise<string> } | null,
  deps: AnalyticsDeps,
): AnalyticsModule {
  return {
    platform: "gbp",
    notConfiguredReason() {
      if (!enabledFlag) return "GBP_ENABLED is not true (waiting on Google Business Profile API approval)";
      if (!config || !tokens) return "GBP credentials are not all set";
      return null;
    },
    async collect(range) {
      const headers = { Authorization: `Bearer ${await tokens!.accessToken()}` };
      const location = `locations/${config!.locationId}`;
      const daily: DailyMetricRow[] = [];
      const events: SocialEventRow[] = [];

      const lastDay = range.days[range.days.length - 1];
      const firstDay = [range.days[0], addDays(lastDay, -(GBP_LAG_DAYS - 1))].sort()[0];
      const url = new URL(`https://businessprofileperformance.googleapis.com/v1/${location}:fetchMultiDailyMetricsTimeSeries`);
      for (const metric of GBP_DAILY_METRICS) url.searchParams.append("dailyMetrics", metric);
      for (const [key, value] of Object.entries({
        ...dateParts(firstDay, "dailyRange.start_date"),
        ...dateParts(lastDay, "dailyRange.end_date"),
      })) {
        url.searchParams.set(key, String(value));
      }
      const performance = await requestJson(deps.fetch, url.toString(), { headers });
      for (const group of performance.multiDailyMetricTimeSeries ?? []) {
        for (const series of group.dailyMetricTimeSeries ?? []) {
          for (const point of series.timeSeries?.datedValues ?? []) {
            const { year, month, day } = point.date ?? {};
            if (!year) continue;
            const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            // Google omits value when it is zero.
            daily.push({ platform: "gbp", metric: series.dailyMetric, date, value: num(point.value) ?? 0 });
          }
        }
      }

      // Search keywords for the previous full month, stored on the 1st.
      const [year, month] = range.today.split("-").map(Number);
      const previous = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
      try {
        const keywords = await requestJson(
          deps.fetch,
          `https://businessprofileperformance.googleapis.com/v1/${location}/searchkeywords/impressions/monthly`,
          {
            headers,
            query: {
              "monthlyRange.start_month.year": previous.year,
              "monthlyRange.start_month.month": previous.month,
              "monthlyRange.end_month.year": previous.year,
              "monthlyRange.end_month.month": previous.month,
              pageSize: 100,
            },
          },
        );
        const monthStart = `${previous.year}-${String(previous.month).padStart(2, "0")}-01`;
        for (const entry of keywords.searchKeywordsCounts ?? []) {
          const exact = num(entry.insightsValue?.value);
          const threshold = num(entry.insightsValue?.threshold);
          // threshold means "fewer than N"; kept under its own metric name.
          const metric = exact !== null ? `search_keyword:${entry.searchKeyword}` : `search_keyword_below:${entry.searchKeyword}`;
          const value = exact ?? threshold;
          if (value !== null) daily.push({ platform: "gbp", metric, date: monthStart, value });
        }
      } catch (error) {
        deps.log.warn(`gbp search keywords: ${error instanceof Error ? error.message : error}`);
      }

      const reviews = await requestJson(
        deps.fetch,
        `https://mybusiness.googleapis.com/v4/accounts/${config!.accountId}/locations/${config!.locationId}/reviews`,
        { headers, query: { pageSize: 50 } },
      );
      const average = num(reviews.averageRating);
      const total = num(reviews.totalReviewCount);
      if (average !== null) daily.push({ platform: "gbp", metric: "review_average_rating", date: range.today, value: average });
      if (total !== null) daily.push({ platform: "gbp", metric: "review_count", date: range.today, value: total });
      const newSince = range.now.getTime() - 2 * 86_400_000;
      let newReviews = 0;
      for (const review of reviews.reviews ?? []) {
        if (Date.parse(review.createTime) >= newSince) newReviews += 1;
        events.push({
          platform: "gbp",
          event_type: "review",
          external_id: `review:${review.reviewId}`,
          author: review.reviewer?.isAnonymous ? null : review.reviewer?.displayName ?? null,
          body: review.comment ?? null,
          tags: [...tagEvent(review.comment), ...(STARS[review.starRating] <= 3 ? ["low-rating"] : []), ...(review.reviewReply ? [] : ["needs-reply"])],
          occurred_at: review.createTime ?? null,
          raw: { starRating: review.starRating, reviewId: review.reviewId, createTime: review.createTime, hasReply: Boolean(review.reviewReply) },
        });
      }
      daily.push({ platform: "gbp", metric: "reviews_new_48h", date: range.today, value: newReviews });

      return { daily, posts: [] as PostMetricRow[], events };
    },
  };
}
