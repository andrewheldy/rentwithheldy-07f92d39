import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig, secretValues, type SocialConfig } from "../config.js";
import { log, registerSecrets } from "../log.js";
import { sleep } from "../http.js";
import { MemoryStore, SupabaseStore, type Store } from "../store.js";
import type { PublisherDeps } from "../publish/types.js";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export function bootstrap(): { config: SocialConfig; store: Store; deps: PublisherDeps } {
  registerSecrets(secretValues(process.env));
  const config = loadConfig(process.env);
  const store: Store = config.supabase ? new SupabaseStore(config.supabase) : new MemoryStore();
  const deps: PublisherDeps = { fetch: globalThis.fetch.bind(globalThis), sleep, now: () => new Date(), log };
  return { config, store, deps };
}

export function runUrl(env = process.env): string | null {
  if (!env.GITHUB_SERVER_URL || !env.GITHUB_REPOSITORY || !env.GITHUB_RUN_ID) return null;
  return `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`;
}

/** Top-level guard: an unexpected crash is logged (redacted) and fails the job. */
export function main(run: () => Promise<number>) {
  run()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      log.error(error instanceof Error ? error.stack ?? error.message : String(error));
      process.exitCode = 1;
    });
}
