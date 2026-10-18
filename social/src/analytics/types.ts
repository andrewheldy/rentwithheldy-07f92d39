import type { Platform } from "../config.js";
import type { FetchLike } from "../http.js";
import type { DailyMetricRow, PostMetricRow, SocialEventRow } from "../store.js";

export interface CollectRange {
  /** Complete local days to collect daily metrics for, oldest first. */
  days: string[];
  /** Today in the business timezone (used for snapshot metrics). */
  today: string;
  now: Date;
  timeZone: string;
}

export interface Collected {
  daily: DailyMetricRow[];
  posts: PostMetricRow[];
  events: SocialEventRow[];
}

export interface AnalyticsDeps {
  fetch: FetchLike;
  log: { info(message: string): void; warn(message: string): void };
}

export interface AnalyticsModule {
  readonly platform: Platform;
  notConfiguredReason(): string | null;
  collect(range: CollectRange): Promise<Collected>;
}

export const POST_LOOKBACK_DAYS = 30;

export const num = (value: unknown): number | null => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
};
