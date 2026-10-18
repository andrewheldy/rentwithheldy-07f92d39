// PR check: validates every post file. Errors fail the check; warnings
// (like em dashes) are annotated but do not.

import { loadConfig } from "../config.js";
import { loadPosts } from "../load-posts.js";
import { log } from "../log.js";
import { markdownTable, writeSummary } from "../summary.js";
import { main, REPO_ROOT } from "./common.js";

main(async () => {
  const config = loadConfig(process.env);
  const { posts, issues } = loadPosts({ repoRoot: REPO_ROOT, mediaBaseUrl: config.mediaBaseUrl });
  for (const issue of issues) {
    const line = `file=${issue.file}::${issue.message}`;
    if (issue.level === "error") console.log(`::error ${line}`);
    else console.log(`::warning ${line}`);
  }
  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level === "warning");

  writeSummary(
    [
      "## Social post validation",
      `${posts.length} valid post file(s), ${errors.length} error(s), ${warnings.length} warning(s).`,
      "",
      markdownTable(
        ["Post", "Status", "Scheduled", "Platforms"],
        posts.map((post) => [post.id, post.status, post.scheduledAtRaw, post.platformList.join(", ") || "-"]),
      ),
      markdownTable(["File", "Level", "Message"], issues.map((issue) => [issue.file, issue.level, issue.message])),
    ].join("\n"),
  );
  log.info(`validated ${posts.length} valid post file(s): ${errors.length} error(s), ${warnings.length} warning(s)`);
  return errors.length ? 1 : 0;
});
