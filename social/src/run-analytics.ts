// Nightly metrics: each platform module collects independently; one
// platform's failure never stops the others. Rows are upserted on their
// natural keys, so re-running a day (or a backfill) is safe.

import type { SocialConfig } from "./config.js";
import { recentDays, localDate } from "./dates.js";
import { errorMessage } from "./log.js";
import type { Store } from "./store.js";
import { markdownTable } from "./summary.js";
import type { AnalyticsModule } from "./analytics/types.js";

export interface RunAnalyticsDeps {
  config: SocialConfig;
  store: Store;
  modules: AnalyticsModule[];
  now: Date;
  backfillDays: number;
  log: { info(message: string): void; warn(message: string): void; error(message: string): void };
}

export async function runAnalytics(deps: RunAnalyticsDeps) {
  const { config, store, modules, now, log } = deps;
  const days = recentDays(now, config.timezone, Math.min(Math.max(deps.backfillDays, 1), 90));
  const range = { days, today: localDate(now, config.timezone), now, timeZone: config.timezone };
  const rows: string[][] = [];
  let failed = 0;

  log.info(`social-analytics: days ${days[0]}..${days[days.length - 1]} (${config.timezone}); store=${store.durable ? "supabase" : "memory"}`);
  if (!store.durable) log.warn("Supabase is not configured: metrics are collected and counted but not stored");

  for (const module of modules) {
    const reason = module.notConfiguredReason();
    if (reason) {
      log.info(`${module.platform}: skipped: not configured (${reason})`);
      rows.push([module.platform, "skipped: not configured", reason]);
      continue;
    }
    try {
      const collected = await module.collect(range);
      await store.upsertDailyMetrics(collected.daily);
      await store.upsertPostMetrics(collected.posts);
      const newEvents = await store.insertEvents(collected.events);
      const detail = `${collected.daily.length} daily, ${collected.posts.length} post metric rows${
        collected.events.length ? `, ${newEvents} new event(s)` : ""
      }`;
      log.info(`${module.platform}: ${detail}`);
      rows.push([module.platform, store.durable ? "stored" : "collected (not stored)", detail]);
    } catch (error) {
      failed += 1;
      const message = errorMessage(error);
      log.error(`${module.platform}: ${message}`);
      rows.push([module.platform, "failed", message]);
    }
  }

  const summary = `## Social analytics\n\n${markdownTable(["Platform", "Result", "Detail"], rows)}`;
  return { summary, exitCode: failed ? 1 : 0 };
}
