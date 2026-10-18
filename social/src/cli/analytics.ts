// Entry point for .github/workflows/social-analytics.yml.

import { createFacebookAnalytics } from "../analytics/facebook.js";
import { createGbpAnalytics } from "../analytics/gbp.js";
import { createInstagramAnalytics } from "../analytics/instagram.js";
import { createTikTokAnalytics } from "../analytics/tiktok.js";
import { log } from "../log.js";
import { createPublishers, createTokenManagers } from "../platforms.js";
import { runAnalytics } from "../run-analytics.js";
import { writeSummary } from "../summary.js";
import { bootstrap, main } from "./common.js";

main(async () => {
  const { config, store, deps } = bootstrap();
  const tokens = createTokenManagers(config, store, deps);
  // The publisher's readiness check covers TikTok's refresh-token rules too.
  const tiktokReason = createPublishers(config, store, deps).tiktok.notConfiguredReason();
  const { summary, exitCode } = await runAnalytics({
    config,
    store,
    now: new Date(),
    backfillDays: Number(process.env.BACKFILL_DAYS || 1) || 1,
    log,
    modules: [
      createInstagramAnalytics(config.meta, deps),
      createFacebookAnalytics(config.meta, deps),
      createTikTokAnalytics(tokens.tiktok, tiktokReason, deps),
      createGbpAnalytics(config.gbp, config.gbpEnabledFlag, tokens.google, deps),
    ],
  });
  writeSummary(summary);
  return exitCode;
});
