// Weekly: refreshes the TikTok token so the stored refresh token keeps
// rotating well inside its 365-day life, and checks the Meta Page token
// still works. Never prints a token.

import { requestJson } from "../http.js";
import { errorMessage, log } from "../log.js";
import { createTokenManagers } from "../platforms.js";
import { markdownTable, writeSummary } from "../summary.js";
import { bootstrap, main } from "./common.js";

main(async () => {
  const { config, store, deps } = bootstrap();
  const tokens = createTokenManagers(config, store, deps);
  const rows: string[][] = [];
  let failed = 0;

  if (!tokens.tiktok) {
    rows.push(["tiktok", "skipped: not configured", "TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET are not set"]);
  } else if (!config.tiktok!.bootstrapRefreshToken && !store.durable) {
    rows.push(["tiktok", "skipped: not configured", "TIKTOK_REFRESH_TOKEN is not set"]);
  } else {
    try {
      await tokens.tiktok.refresh();
      rows.push(["tiktok", "refreshed", store.durable ? "rotation stored in social_tokens" : "Supabase not configured; nothing stored"]);
    } catch (error) {
      failed += 1;
      rows.push(["tiktok", "failed", errorMessage(error)]);
    }
  }

  const token = config.meta.pageAccessToken;
  if (!token) {
    rows.push(["meta", "skipped: not configured", "FB_PAGE_ACCESS_TOKEN is not set"]);
  } else {
    try {
      const me = await requestJson(deps.fetch, `https://graph.facebook.com/${config.meta.graphVersion}/me`, {
        query: { fields: "id,name", access_token: token },
      });
      rows.push(["meta", "token works", `Page ${me.name ?? me.id}`]);
    } catch (error) {
      failed += 1;
      rows.push(["meta", "failed", `${errorMessage(error)} (generate a new long-lived Page token)`]);
    }
  }

  for (const row of rows) log.info(`${row[0]}: ${row[1]} (${row[2]})`);
  writeSummary(`## Social token check\n\n${markdownTable(["Provider", "Result", "Detail"], rows)}`);
  return failed ? 1 : 0;
});
