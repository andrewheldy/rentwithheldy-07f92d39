// Environment loading for the social pipeline. Every value is optional: a
// missing credential disables the module that needs it, it never throws.
// The one rule that is not optional is DRY_RUN — anything other than the
// exact string "false" keeps the publisher in dry-run mode.

export const PLATFORMS = ["instagram", "facebook", "tiktok", "gbp"] as const;
export type Platform = (typeof PLATFORMS)[number];

export type Env = Record<string, string | undefined>;

export interface SupabaseConfig {
  url: string;
  serviceKey: string;
}

export interface MetaConfig {
  graphVersion: string;
  pageId: string | null;
  pageAccessToken: string | null;
  igUserId: string | null;
  igAccessToken: string | null;
}

export interface TikTokConfig {
  clientKey: string;
  clientSecret: string;
  bootstrapRefreshToken: string | null;
  audited: boolean;
  /** PULL_FROM_URL needs a verified domain/URL prefix; otherwise FILE_UPLOAD. */
  pullFromUrl: boolean;
}

export interface GbpConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accountId: string;
  locationId: string;
}

export interface AlertConfig {
  resendApiKey: string;
  to: string;
  from: string;
}

export interface SocialConfig {
  dryRun: boolean;
  /** Human-readable reason dry-run is on (or "live"). Logged on every run. */
  dryRunReason: string;
  timezone: string;
  /** Public origin that serves public/social-media/ (the deployed site). */
  mediaBaseUrl: string;
  supabase: SupabaseConfig | null;
  meta: MetaConfig;
  tiktok: TikTokConfig | null;
  gbp: GbpConfig | null;
  gbpEnabledFlag: boolean;
  alert: AlertConfig | null;
}

// Latest Graph API version per Meta's changelog on 2026-10-18 (v26.0,
// released 2026-07-29). Override with META_GRAPH_VERSION when Meta ships a
// newer one.
export const DEFAULT_GRAPH_VERSION = "v26.0";

const clean = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const isTrue = (value: string | undefined) => clean(value)?.toLowerCase() === "true";

export function resolveDryRun(env: Env): { dryRun: boolean; reason: string } {
  const flag = clean(env.DRY_RUN);
  if (flag !== "false") {
    return { dryRun: true, reason: flag ? `DRY_RUN=${flag}` : "DRY_RUN is not set (defaults to true)" };
  }
  // workflow_dispatch can only make a run drier, never live on its own.
  if (clean(env.DISPATCH_DRY_RUN) && clean(env.DISPATCH_DRY_RUN) !== "false") {
    return { dryRun: true, reason: "manual run requested dry_run" };
  }
  // A manual run on a feature branch must never publish unmerged posts.
  const ref = clean(env.GITHUB_REF_NAME);
  const defaultBranch = clean(env.DEFAULT_BRANCH);
  if (ref && defaultBranch && ref !== defaultBranch) {
    return { dryRun: true, reason: `running on ${ref}, not the default branch ${defaultBranch}` };
  }
  if (env.GITHUB_ACTIONS === "true" && (!ref || !defaultBranch)) {
    return { dryRun: true, reason: "cannot confirm the run is on the default branch" };
  }
  return { dryRun: false, reason: "live (DRY_RUN=false)" };
}

export function loadConfig(env: Env = process.env): SocialConfig {
  const { dryRun, reason } = resolveDryRun(env);

  const supabaseUrl = clean(env.SUPABASE_URL);
  const supabaseKey = clean(env.SUPABASE_SECRET_KEY) ?? clean(env.SUPABASE_SERVICE_ROLE_KEY);

  const pageAccessToken = clean(env.FB_PAGE_ACCESS_TOKEN);
  const tiktokKey = clean(env.TIKTOK_CLIENT_KEY);
  const tiktokSecret = clean(env.TIKTOK_CLIENT_SECRET);

  const gbpFields = {
    clientId: clean(env.GBP_CLIENT_ID),
    clientSecret: clean(env.GBP_CLIENT_SECRET),
    refreshToken: clean(env.GBP_REFRESH_TOKEN),
    accountId: clean(env.GBP_ACCOUNT_ID),
    locationId: clean(env.GBP_LOCATION_ID),
  };
  const gbpComplete = Object.values(gbpFields).every(Boolean);

  const resendApiKey = clean(env.RESEND_API_KEY);
  const alertTo = clean(env.ALERT_EMAIL);

  return {
    dryRun,
    dryRunReason: reason,
    timezone: clean(env.SOCIAL_TIMEZONE) ?? "America/New_York",
    mediaBaseUrl: (clean(env.SOCIAL_MEDIA_BASE_URL) ?? "https://rentwithheldy.com").replace(/\/+$/, ""),
    supabase: supabaseUrl && supabaseKey ? { url: supabaseUrl, serviceKey: supabaseKey } : null,
    meta: {
      graphVersion: clean(env.META_GRAPH_VERSION) ?? DEFAULT_GRAPH_VERSION,
      pageId: clean(env.FB_PAGE_ID),
      pageAccessToken,
      igUserId: clean(env.IG_USER_ID),
      // With Instagram API with Facebook Login the Page token publishes to IG.
      igAccessToken: clean(env.IG_ACCESS_TOKEN) ?? pageAccessToken,
    },
    tiktok:
      tiktokKey && tiktokSecret
        ? {
            clientKey: tiktokKey,
            clientSecret: tiktokSecret,
            bootstrapRefreshToken: clean(env.TIKTOK_REFRESH_TOKEN),
            audited: isTrue(env.TIKTOK_AUDITED),
            pullFromUrl: isTrue(env.TIKTOK_PULL_FROM_URL),
          }
        : null,
    gbp:
      isTrue(env.GBP_ENABLED) && gbpComplete
        ? ({ enabled: true, ...gbpFields } as GbpConfig)
        : null,
    gbpEnabledFlag: isTrue(env.GBP_ENABLED),
    alert:
      resendApiKey && alertTo
        ? {
            resendApiKey,
            to: alertTo,
            from: clean(env.RESEND_FROM_EMAIL) ?? "Rent With Heldy Social <social@rentwithheldy.com>",
          }
        : null,
  };
}

/** Every secret value in the environment, so the logger can redact them. */
export function secretValues(env: Env = process.env): string[] {
  const secretKeys = /(TOKEN|SECRET|KEY|PASSWORD)/;
  return Object.entries(env)
    .filter(([key, value]) => secretKeys.test(key) && typeof value === "string" && value.trim().length >= 8)
    .map(([, value]) => value!.trim());
}
