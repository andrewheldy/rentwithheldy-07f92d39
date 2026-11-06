// Builds every platform publisher from config. Unconfigured platforms still
// get a publisher; it reports why it is skipped.

import type { Platform, SocialConfig } from "./config.js";
import { createFacebookPublisher } from "./publish/facebook.js";
import { createGbpPublisher } from "./publish/gbp.js";
import { createInstagramPublisher } from "./publish/instagram.js";
import { createTikTokPublisher } from "./publish/tiktok.js";
import type { PlatformPublisher, PublisherDeps } from "./publish/types.js";
import type { Store } from "./store.js";
import { createGoogleTokens, createTikTokTokens } from "./tokens.js";

export function createTokenManagers(config: SocialConfig, store: Store, deps: PublisherDeps) {
  return {
    tiktok: config.tiktok ? createTikTokTokens(config.tiktok, { ...deps, store }) : null,
    google: config.gbp ? createGoogleTokens(config.gbp, deps) : null,
  };
}

export function createPublishers(
  config: SocialConfig,
  store: Store,
  deps: PublisherDeps,
): Record<Platform, PlatformPublisher> {
  const tokens = createTokenManagers(config, store, deps);
  return {
    instagram: createInstagramPublisher(config.meta, deps),
    facebook: createFacebookPublisher(config.meta, deps),
    tiktok: createTikTokPublisher(config.tiktok, tokens.tiktok, store.durable, deps),
    gbp: createGbpPublisher(config.gbp, config.gbpEnabledFlag, tokens.google, config.timezone, deps),
  };
}
