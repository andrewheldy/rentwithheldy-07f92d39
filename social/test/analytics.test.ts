// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createFacebookAnalytics } from "../src/analytics/facebook.js";
import { createGbpAnalytics } from "../src/analytics/gbp.js";
import { createInstagramAnalytics } from "../src/analytics/instagram.js";
import { createTikTokAnalytics } from "../src/analytics/tiktok.js";
import { runAnalytics } from "../src/run-analytics.js";
import type { Env } from "../src/config.js";
import { MemoryStore } from "../src/store.js";
import { config, DurableMemoryStore, FULL_ENV, silentLog } from "./helpers.js";

const NOW = new Date("2026-10-18T07:15:00Z");
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function modulesFor(env: Env, fetchImpl: typeof fetch) {
  const cfg = config(env);
  const deps = { fetch: fetchImpl, log: silentLog() };
  const tokens = { accessToken: async () => "token" };
  return {
    cfg,
    modules: [
      createInstagramAnalytics(cfg.meta, deps),
      createFacebookAnalytics(cfg.meta, deps),
      createTikTokAnalytics(cfg.tiktok ? tokens : null, cfg.tiktok ? null : "TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET are not set", deps),
      createGbpAnalytics(cfg.gbp, cfg.gbpEnabledFlag, cfg.gbp ? tokens : null, deps),
    ],
  };
}

describe("runAnalytics", () => {
  it("skips every platform cleanly with no credentials", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const { cfg, modules } = modulesFor({}, fetchImpl);
    const log = silentLog();
    const result = await runAnalytics({ config: cfg, store: new MemoryStore(), modules, now: NOW, backfillDays: 1, log });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.exitCode).toBe(0);
    expect(log.lines.filter((line) => line.includes("skipped: not configured"))).toHaveLength(4);
  });

  it("parses Google performance, keywords and reviews and upserts idempotently", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("fetchMultiDailyMetricsTimeSeries")) {
        expect(url).toContain("dailyMetrics=CALL_CLICKS");
        expect(url).toContain("dailyRange.end_date.day=17");
        return json({
          multiDailyMetricTimeSeries: [
            {
              dailyMetricTimeSeries: [
                { dailyMetric: "CALL_CLICKS", timeSeries: { datedValues: [{ date: { year: 2026, month: 10, day: 16 }, value: "3" }, { date: { year: 2026, month: 10, day: 17 } }] } },
              ],
            },
          ],
        });
      }
      if (url.includes("searchkeywords")) {
        return json({ searchKeywordsCounts: [{ searchKeyword: "car rental dania beach", insightsValue: { value: "42" } }, { searchKeyword: "fll car delivery", insightsValue: { threshold: "15" } }] });
      }
      if (url.includes("/reviews")) {
        return json({
          averageRating: 4.9,
          totalReviewCount: 57,
          reviews: [{ reviewId: "r1", starRating: "FIVE", comment: "Car was waiting at the airport.", createTime: "2026-10-17T12:00:00Z", reviewer: { displayName: "Guest" } }],
        });
      }
      return json({}, 404);
    }) as unknown as typeof fetch;
    const { cfg, modules } = modulesFor(FULL_ENV, fetchImpl);
    const store = new DurableMemoryStore();
    const gbpOnly = modules.filter((module) => module.platform === "gbp");
    const run = () => runAnalytics({ config: cfg, store, modules: gbpOnly, now: NOW, backfillDays: 1, log: silentLog() });
    expect((await run()).exitCode).toBe(0);
    await run();
    expect(store.dailyMetrics.get("gbp:CALL_CLICKS:2026-10-16")?.value).toBe(3);
    expect(store.dailyMetrics.get("gbp:CALL_CLICKS:2026-10-17")?.value).toBe(0);
    expect(store.dailyMetrics.get("gbp:search_keyword:car rental dania beach:2026-09-01")?.value).toBe(42);
    expect(store.dailyMetrics.get("gbp:search_keyword_below:fll car delivery:2026-09-01")?.value).toBe(15);
    expect(store.dailyMetrics.get("gbp:review_average_rating:2026-10-18")?.value).toBe(4.9);
    expect(store.events.get("gbp:review:r1")).toMatchObject({ event_type: "review", tags: expect.arrayContaining(["inquiry", "needs-reply"]) });
    expect(store.events.size).toBe(1);
  });

  it("keeps going when one platform fails, and fails the job", async () => {
    const fetchImpl = vi.fn(async () => json({ error: { message: "Invalid OAuth access token", code: 190 } }, 400)) as unknown as typeof fetch;
    const { cfg, modules } = modulesFor({ FB_PAGE_ID: "111", FB_PAGE_ACCESS_TOKEN: "page-token-x", IG_USER_ID: "222" }, fetchImpl);
    const log = silentLog();
    const result = await runAnalytics({ config: cfg, store: new MemoryStore(), modules, now: NOW, backfillDays: 1, log });
    expect(result.exitCode).toBe(1);
    expect(result.summary).toMatch(/instagram \| failed \| HTTP 400 190: Invalid OAuth access token/);
    expect(result.summary).toMatch(/facebook \| failed/);
    expect(result.summary).toMatch(/tiktok \| skipped: not configured/);
  });
});
