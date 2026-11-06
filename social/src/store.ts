// Persistence. SupabaseStore is the real one; MemoryStore mirrors the same
// claim rules (see social_claim_publication in the migration) for tests and
// for dry runs when Supabase is not configured. Live publishing refuses to
// run on a MemoryStore because it cannot guarantee once-only publishing.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Platform, SupabaseConfig } from "./config.js";
import type { SocialPost } from "./load-posts.js";
import { redact } from "./log.js";

export type PublicationState = "publishing" | "published" | "failed" | "dry_run" | "skipped";

export interface PublicationRow {
  post_id: string;
  platform: Platform;
  state: PublicationState;
  attempts: number;
  content_hash: string | null;
  platform_post_id: string | null;
  permalink: string | null;
  published_at: string | null;
  last_error: string | null;
  updated_at: string;
}

export interface ClaimOptions {
  live: boolean;
  contentHash: string;
  maxAttempts: number;
}

export interface SocialEventRow {
  platform: Platform;
  event_type: "comment" | "mention" | "message" | "review" | "post";
  external_id: string;
  author: string | null;
  body: string | null;
  tags: string[];
  occurred_at: string | null;
  raw: unknown;
}

export interface DailyMetricRow {
  platform: Platform;
  metric: string;
  date: string;
  value: number;
}

export interface PostMetricRow {
  platform: Platform;
  platform_post_id: string;
  metric: string;
  captured_on: string;
  value: number;
}

export interface TokenRow {
  provider: "tiktok" | "gbp" | "meta";
  refresh_token: string | null;
  access_token: string | null;
  expires_at: string | null;
}

export interface Store {
  readonly durable: boolean;
  upsertPosts(posts: SocialPost[]): Promise<void>;
  listPublications(postIds: string[]): Promise<PublicationRow[]>;
  listPublished(platform: Platform, sinceIso: string): Promise<PublicationRow[]>;
  claim(postId: string, platform: Platform, options: ClaimOptions): Promise<PublicationRow | null>;
  markPublished(postId: string, platform: Platform, result: { platformPostId: string; permalink: string | null }): Promise<void>;
  /** final: no automatic retries (outcome unknown); attempts jumps to finalAttempts. */
  markFailed(postId: string, platform: Platform, error: string, finalAttempts?: number): Promise<void>;
  markDryRun(postId: string, platform: Platform): Promise<void>;
  insertEvents(events: SocialEventRow[]): Promise<number>;
  upsertDailyMetrics(rows: DailyMetricRow[]): Promise<void>;
  upsertPostMetrics(rows: PostMetricRow[]): Promise<void>;
  getToken(provider: TokenRow["provider"]): Promise<TokenRow | null>;
  saveToken(token: TokenRow): Promise<void>;
}

const backoffMs = (attempts: number) => 15 * 60_000 * 2 ** Math.max(attempts - 1, 0);

const postRow = (post: SocialPost) => ({
  id: post.id,
  file_path: post.filePath,
  status: post.status,
  scheduled_at: post.scheduledAt.toISOString(),
  platforms: post.platformList,
  utm_campaign: post.utmCampaign,
  content_hash: post.contentHash,
  updated_at: new Date().toISOString(),
});

export class MemoryStore implements Store {
  readonly durable = false;
  posts = new Map<string, ReturnType<typeof postRow>>();
  publications = new Map<string, PublicationRow>();
  events = new Map<string, SocialEventRow>();
  dailyMetrics = new Map<string, DailyMetricRow>();
  postMetrics = new Map<string, PostMetricRow>();
  tokens = new Map<string, TokenRow>();
  constructor(private readonly now: () => Date = () => new Date()) {}

  private key = (postId: string, platform: string) => `${postId}:${platform}`;

  async upsertPosts(posts: SocialPost[]) {
    for (const post of posts) this.posts.set(post.id, postRow(post));
  }
  async listPublications(postIds: string[]) {
    return [...this.publications.values()].filter((row) => postIds.includes(row.post_id));
  }
  async listPublished(platform: Platform, sinceIso: string) {
    return [...this.publications.values()].filter(
      (row) => row.platform === platform && row.state === "published" && (row.published_at ?? "") >= sinceIso,
    );
  }
  async claim(postId: string, platform: Platform, { live, contentHash, maxAttempts }: ClaimOptions) {
    // JS is single-threaded and this method has no awaits before the write,
    // so check-and-set is atomic, like the SQL statement it mirrors.
    const key = this.key(postId, platform);
    const existing = this.publications.get(key);
    const now = this.now();
    if (existing) {
      const claimable =
        live &&
        (existing.state === "dry_run" ||
          (existing.state === "failed" &&
            existing.attempts < maxAttempts &&
            now.getTime() - Date.parse(existing.updated_at) >= backoffMs(existing.attempts)));
      if (!claimable) return null;
    }
    const row: PublicationRow = {
      post_id: postId,
      platform,
      state: "publishing",
      attempts: existing ? existing.attempts + 1 : live ? 1 : 0,
      content_hash: contentHash,
      platform_post_id: existing?.platform_post_id ?? null,
      permalink: existing?.permalink ?? null,
      published_at: existing?.published_at ?? null,
      last_error: null,
      updated_at: now.toISOString(),
    };
    this.publications.set(key, row);
    return { ...row };
  }
  private update(postId: string, platform: Platform, patch: Partial<PublicationRow>) {
    const key = this.key(postId, platform);
    const row = this.publications.get(key);
    if (!row || row.state !== "publishing") return;
    this.publications.set(key, { ...row, ...patch, updated_at: this.now().toISOString() });
  }
  async markPublished(postId: string, platform: Platform, result: { platformPostId: string; permalink: string | null }) {
    this.update(postId, platform, {
      state: "published",
      platform_post_id: result.platformPostId,
      permalink: result.permalink,
      published_at: this.now().toISOString(),
    });
  }
  async markFailed(postId: string, platform: Platform, error: string, finalAttempts?: number) {
    this.update(postId, platform, {
      state: "failed",
      last_error: redact(error).slice(0, 2000),
      ...(finalAttempts ? { attempts: finalAttempts } : {}),
    });
  }
  async markDryRun(postId: string, platform: Platform) {
    this.update(postId, platform, { state: "dry_run" });
  }
  async insertEvents(events: SocialEventRow[]) {
    let inserted = 0;
    for (const event of events) {
      const key = `${event.platform}:${event.external_id}`;
      if (this.events.has(key)) continue;
      this.events.set(key, event);
      inserted += 1;
    }
    return inserted;
  }
  async upsertDailyMetrics(rows: DailyMetricRow[]) {
    for (const row of rows) this.dailyMetrics.set(`${row.platform}:${row.metric}:${row.date}`, row);
  }
  async upsertPostMetrics(rows: PostMetricRow[]) {
    for (const row of rows) {
      this.postMetrics.set(`${row.platform}:${row.platform_post_id}:${row.metric}:${row.captured_on}`, row);
    }
  }
  async getToken(provider: TokenRow["provider"]) {
    return this.tokens.get(provider) ?? null;
  }
  async saveToken(token: TokenRow) {
    this.tokens.set(token.provider, token);
  }
}

function check(error: { message: string; code?: string } | null, action: string) {
  if (error) throw new Error(redact(`Supabase ${action} failed: ${error.code ?? ""} ${error.message}`.trim()));
}

export class SupabaseStore implements Store {
  readonly durable = true;
  private readonly db: SupabaseClient;

  constructor(config: SupabaseConfig, fetchImpl?: typeof fetch) {
    this.db = createClient(config.url, config.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: fetchImpl ? { fetch: fetchImpl } : undefined,
    });
  }

  async upsertPosts(posts: SocialPost[]) {
    if (posts.length === 0) return;
    const { error } = await this.db.from("social_posts").upsert(posts.map(postRow), { onConflict: "id" });
    check(error, "upsert social_posts");
  }
  async listPublications(postIds: string[]) {
    if (postIds.length === 0) return [];
    const { data, error } = await this.db.from("social_publications").select("*").in("post_id", postIds);
    check(error, "read social_publications");
    return (data ?? []) as PublicationRow[];
  }
  async listPublished(platform: Platform, sinceIso: string) {
    const { data, error } = await this.db
      .from("social_publications")
      .select("*")
      .eq("platform", platform)
      .eq("state", "published")
      .gte("published_at", sinceIso);
    check(error, "read published posts");
    return (data ?? []) as PublicationRow[];
  }
  async claim(postId: string, platform: Platform, { live, contentHash, maxAttempts }: ClaimOptions) {
    const { data, error } = await this.db.rpc("social_claim_publication", {
      p_post_id: postId,
      p_platform: platform,
      p_live: live,
      p_content_hash: contentHash,
      p_max_attempts: maxAttempts,
    });
    check(error, "claim publication");
    const rows = (data ?? []) as PublicationRow[];
    return rows[0] ?? null;
  }
  private async update(postId: string, platform: Platform, patch: Record<string, unknown>) {
    const { error } = await this.db
      .from("social_publications")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("post_id", postId)
      .eq("platform", platform)
      .eq("state", "publishing");
    check(error, "update publication");
  }
  async markPublished(postId: string, platform: Platform, result: { platformPostId: string; permalink: string | null }) {
    await this.update(postId, platform, {
      state: "published",
      platform_post_id: result.platformPostId,
      permalink: result.permalink,
      published_at: new Date().toISOString(),
    });
  }
  async markFailed(postId: string, platform: Platform, error: string, finalAttempts?: number) {
    await this.update(postId, platform, {
      state: "failed",
      last_error: redact(error).slice(0, 2000),
      ...(finalAttempts ? { attempts: finalAttempts } : {}),
    });
  }
  async markDryRun(postId: string, platform: Platform) {
    await this.update(postId, platform, { state: "dry_run" });
  }
  async insertEvents(events: SocialEventRow[]) {
    if (events.length === 0) return 0;
    const { data, error } = await this.db
      .from("social_events")
      .upsert(events, { onConflict: "platform,external_id", ignoreDuplicates: true })
      .select("id");
    check(error, "insert social_events");
    return data?.length ?? 0;
  }
  async upsertDailyMetrics(rows: DailyMetricRow[]) {
    if (rows.length === 0) return;
    const stamped = rows.map((row) => ({ ...row, updated_at: new Date().toISOString() }));
    const { error } = await this.db.from("social_metrics_daily").upsert(stamped, { onConflict: "platform,metric,date" });
    check(error, "upsert social_metrics_daily");
  }
  async upsertPostMetrics(rows: PostMetricRow[]) {
    if (rows.length === 0) return;
    const stamped = rows.map((row) => ({ ...row, updated_at: new Date().toISOString() }));
    const { error } = await this.db
      .from("social_post_metrics")
      .upsert(stamped, { onConflict: "platform,platform_post_id,metric,captured_on" });
    check(error, "upsert social_post_metrics");
  }
  async getToken(provider: TokenRow["provider"]) {
    const { data, error } = await this.db.from("social_tokens").select("*").eq("provider", provider).maybeSingle();
    check(error, "read social_tokens");
    return (data as TokenRow | null) ?? null;
  }
  async saveToken(token: TokenRow) {
    const { error } = await this.db
      .from("social_tokens")
      .upsert({ ...token, updated_at: new Date().toISOString() }, { onConflict: "provider" });
    check(error, "save social_tokens");
  }
}
