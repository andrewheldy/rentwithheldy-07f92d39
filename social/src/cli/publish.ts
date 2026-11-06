// Entry point for .github/workflows/social-publish.yml.

import { sendFailureAlert } from "../alert.js";
import { loadPosts } from "../load-posts.js";
import { log } from "../log.js";
import { createPublishers } from "../platforms.js";
import { defaultCheckUrl, runPublish } from "../run-publish.js";
import { writeSummary } from "../summary.js";
import { bootstrap, main, REPO_ROOT, runUrl } from "./common.js";

main(async () => {
  const { config, store, deps } = bootstrap();
  const { posts, issues } = loadPosts({ repoRoot: REPO_ROOT, mediaBaseUrl: config.mediaBaseUrl });
  const report = await runPublish({
    config,
    store,
    publishers: createPublishers(config, store, deps),
    posts,
    issues,
    now: new Date(),
    postId: process.env.POST_ID ?? null,
    checkUrl: (url) => defaultCheckUrl(deps.fetch, url),
    log,
    fetch: deps.fetch,
  });
  writeSummary(report.summary);

  if (report.alertLines.length) {
    const alert = await sendFailureAlert(
      config.alert,
      deps.fetch,
      "Rent With Heldy social: a post failed to publish",
      report.alertLines,
      runUrl(),
    );
    log.info(`failure alert email: ${alert}`);
  }
  return report.exitCode;
});
