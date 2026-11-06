// OAuth access tokens for TikTok and Google Business Profile.
//
// TikTok (developers.tiktok.com/doc/oauth-user-access-token-management):
// access tokens last 24h, refresh tokens 365 days, and a refresh may return
// a NEW refresh token that must replace the old one. Rotations are stored in
// social_tokens (service role only); TIKTOK_REFRESH_TOKEN only bootstraps.
//
// Google: a long-lived offline refresh token from GBP_REFRESH_TOKEN; each run
// exchanges it for a 1h access token, nothing is stored.

import type { GbpConfig, TikTokConfig } from "./config.js";
import { ApiError, requestJson, type FetchLike } from "./http.js";
import type { Store } from "./store.js";

const EARLY_REFRESH_MS = 10 * 60_000;

export interface TokenDeps {
  fetch: FetchLike;
  store: Store;
  now: () => Date;
  log: { info(message: string): void; warn(message: string): void };
}

export function createTikTokTokens(config: TikTokConfig, deps: TokenDeps) {
  let cached: { accessToken: string; expiresAt: number } | null = null;

  async function exchange(refreshToken: string) {
    return requestJson(deps.fetch, "https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: config.clientKey,
        client_secret: config.clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
  }

  async function refresh(): Promise<string> {
    const stored = await deps.store.getToken("tiktok");
    const candidates = [stored?.refresh_token, config.bootstrapRefreshToken].filter(
      (value, index, list): value is string => Boolean(value) && list.indexOf(value) === index,
    );
    if (candidates.length === 0) throw new Error("tiktok: no refresh token (set TIKTOK_REFRESH_TOKEN)");

    let lastError: unknown = null;
    for (const refreshToken of candidates) {
      try {
        const response = await exchange(refreshToken);
        if (!response.access_token) throw new Error(`tiktok token refresh returned no access_token`);
        const now = deps.now().getTime();
        cached = { accessToken: response.access_token, expiresAt: now + Number(response.expires_in ?? 86400) * 1000 };
        const nextRefresh: string = response.refresh_token ?? refreshToken;
        if (deps.store.durable) {
          await deps.store.saveToken({
            provider: "tiktok",
            refresh_token: nextRefresh,
            access_token: cached.accessToken,
            expires_at: new Date(cached.expiresAt).toISOString(),
          });
        } else if (nextRefresh !== refreshToken) {
          deps.log.warn(
            "tiktok: TikTok rotated the refresh token but Supabase is not configured to store it. " +
              "Configure Supabase (or re-authorize and update TIKTOK_REFRESH_TOKEN) before the old one expires.",
          );
        }
        return cached.accessToken;
      } catch (error) {
        lastError = error;
        if (!(error instanceof ApiError) || error.status >= 500) break;
      }
    }
    throw lastError instanceof Error ? lastError : new Error("tiktok token refresh failed");
  }

  return {
    async accessToken(): Promise<string> {
      const now = deps.now().getTime();
      if (cached && cached.expiresAt - EARLY_REFRESH_MS > now) return cached.accessToken;
      const stored = await deps.store.getToken("tiktok");
      if (stored?.access_token && stored.expires_at && Date.parse(stored.expires_at) - EARLY_REFRESH_MS > now) {
        cached = { accessToken: stored.access_token, expiresAt: Date.parse(stored.expires_at) };
        return cached.accessToken;
      }
      return refresh();
    },
    /** Forces a refresh; used by the weekly job to keep the refresh token alive. */
    refresh,
  };
}

export function createGoogleTokens(config: GbpConfig, deps: Pick<TokenDeps, "fetch" | "now">) {
  let cached: { accessToken: string; expiresAt: number } | null = null;
  return {
    async accessToken(): Promise<string> {
      const now = deps.now().getTime();
      if (cached && cached.expiresAt - EARLY_REFRESH_MS > now) return cached.accessToken;
      const response = await requestJson(deps.fetch, "https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: "refresh_token",
          refresh_token: config.refreshToken,
        }),
      });
      cached = { accessToken: response.access_token, expiresAt: now + Number(response.expires_in ?? 3600) * 1000 };
      return cached.accessToken;
    },
  };
}
