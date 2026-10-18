// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { createPublishers } from "../src/platforms.js";
import { instagramContainers } from "../src/publish/instagram.js";
import { facebookRequest } from "../src/publish/facebook.js";
import { gbpLocalPost } from "../src/publish/gbp.js";
import { chunkPlan, resolvePrivacy } from "../src/publish/tiktok.js";
import { runPublish } from "../src/run-publish.js";
import { MemoryStore, type Store } from "../src/store.js";
import { registerSecrets } from "../src/log.js";
import { approvedPost, config, DurableMemoryStore, FULL_ENV, makeRepo, parse, baseFrontmatter, silentLog, videoPost } from "./helpers.js";
import type { SocialPost } from "../src/load-posts.js";

const NOW = new Date("2026-10-25T14:05:00Z");
const PLATFORM_HOSTS = /graph\.facebook\.com|open\.tiktokapis\.com|mybusiness\.googleapis\.com|oauth2\.googleapis\.com/;

type Route = (url: URL, init: RequestInit) => Response | Promise<Response>;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

/** Fake platform APIs; every request is recorded. */
function fakeApis(overrides: Array<[RegExp, Route]> = []) {
  const calls: Array<{ method: string; url: string; body: string }> = [];
  const routes: Array<[RegExp, Route]> = [
    ...overrides,
    [/oauth2\.googleapis\.com\/token/, () => json({ access_token: "ya29.google-access", expires_in: 3600 })],
    [/open\.tiktokapis\.com\/v2\/oauth\/token/, () => json({ access_token: "act.tiktok-access", expires_in: 86400, refresh_token: "rft.rotated" })],
    [/creator_info\/query/, () => json({ data: { privacy_level_options: ["SELF_ONLY", "PUBLIC_TO_EVERYONE"], creator_username: "rentwithheldy" }, error: { code: "ok" } })],
    [/video\/init/, () => json({ data: { publish_id: "v_pub_1" }, error: { code: "ok" } })],
    [/status\/fetch/, () => json({ data: { status: "PUBLISH_COMPLETE", publicaly_available_post_id: [] }, error: { code: "ok" } })],
    [/content_publishing_limit/, () => json({ data: [{ quota_usage: 1, config: { quota_total: 50 } }] })],
    [/\/222\/media_publish/, () => json({ id: "ig_media_1" })],
    [/\/222\/media$/, () => json({ id: "ig_container_1" })],
    [/ig_media_1/, () => json({ permalink: "https://www.instagram.com/p/abc/" })],
    [/\/111\/photos/, () => json({ id: "photo_1", post_id: "111_999" })],
    [/111_999/, () => json({ permalink_url: "https://www.facebook.com/111/posts/999" })],
    [/localPosts/, () => json({ name: "accounts/333/locations/444/localPosts/555", searchUrl: "https://local.google.com/post/555", state: "LIVE" })],
  ];
  const fetch = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(String(input));
    const body = init.body instanceof URLSearchParams ? init.body.toString() : typeof init.body === "string" ? init.body : "";
    calls.push({ method: init.method ?? "GET", url: url.toString(), body });
    for (const [pattern, route] of routes) if (pattern.test(url.toString())) return route(url, init);
    return json({ error: { message: `unmocked ${url}` } }, 404);
  }) as unknown as typeof globalThis.fetch;
  return { fetch, calls, platformCalls: () => calls.filter((call) => PLATFORM_HOSTS.test(call.url)) };
}

function setup(options: { env?: Record<string, string>; store?: Store; posts?: SocialPost[]; apis?: ReturnType<typeof fakeApis>; reachable?: boolean } = {}) {
  const apis = options.apis ?? fakeApis();
  const cfg = config(options.env ?? FULL_ENV);
  const store = options.store ?? new DurableMemoryStore(() => NOW);
  const log = silentLog();
  const deps = { fetch: apis.fetch, sleep: async () => {}, now: () => NOW, log };
  const run = (extra: { postId?: string; now?: Date } = {}) =>
    runPublish({
      config: cfg,
      store,
      publishers: createPublishers(cfg, store, deps),
      posts: options.posts ?? [approvedPost()],
      issues: [],
      now: extra.now ?? NOW,
      postId: extra.postId,
      checkUrl: async () => options.reachable ?? true,
      log,
      fetch: apis.fetch,
    });
  return { apis, cfg, store, log, run };
}

const outcomes = (report: Awaited<ReturnType<typeof runPublish>>) =>
  Object.fromEntries(report.results.map((result) => [result.platform, result.outcome]));

describe("runPublish in dry-run mode", () => {
  it("makes no platform API calls, logs payloads and records dry_run rows", async () => {
    const { apis, store, log, run } = setup();
    const report = await run();
    expect(apis.platformCalls()).toEqual([]);
    expect(outcomes(report)).toEqual({ instagram: "dry_run", facebook: "dry_run", gbp: "dry_run" });
    expect([...(store as MemoryStore).publications.values()].map((row) => row.state)).toEqual(["dry_run", "dry_run", "dry_run"]);
    const payloadLog = log.lines.find((line) => line.includes("→ facebook: DRY RUN payload"))!;
    expect(payloadLog).toContain("utm_source=facebook&utm_medium=social&utm_campaign=fll-delivery-oct&utm_content=2026-10-25-airport-delivery");
    expect(report.summary).toContain("Social publisher: dry run");
    expect(report.exitCode).toBe(0);
  });

  it("previews each pair once, then stays quiet", async () => {
    const { run } = setup();
    await run();
    const second = await run();
    expect(new Set(Object.values(outcomes(second)))).toEqual(new Set(["not_claimable"]));
  });

  it("works without Supabase (in-memory) and logs the payloads", async () => {
    const { apis, run } = setup({ env: { ...FULL_ENV, SUPABASE_URL: "" }, store: new MemoryStore(() => NOW) });
    const report = await run();
    expect(apis.platformCalls()).toEqual([]);
    expect(Object.values(outcomes(report))).toEqual(["dry_run", "dry_run", "dry_run"]);
  });

  it("previews a single post on a manual dry run without recording anything", async () => {
    const { store, run } = setup();
    const report = await run({ postId: "2026-10-25-airport-delivery" });
    expect(Object.values(outcomes(report))).toEqual(["preview", "preview", "preview"]);
    expect((store as MemoryStore).publications.size).toBe(0);
  });

  it("never logs secrets", async () => {
    registerSecrets(Object.values(FULL_ENV).filter((value): value is string => (value ?? "").length >= 8));
    const { log, run } = setup();
    const report = await run();
    const everything = log.lines.join("\n") + report.summary;
    for (const secret of ["EAAG-page-token-secret", "tt-client-secret-value", "rft.tiktok-refresh-token", "sb_secret_test_value_123"]) {
      expect(everything).not.toContain(secret);
    }
  });
});

describe("runPublish safety gates", () => {
  it("skips every platform cleanly when no credentials are configured", async () => {
    const { apis, store, run } = setup({ env: { DRY_RUN: "false" }, store: new MemoryStore(() => NOW) });
    const report = await run();
    expect(apis.calls).toEqual([]);
    // No Supabase either, so the live run refuses before touching anything.
    expect(report.summary).toContain("refusing to publish live without the once-only publishing store");
    expect(report.exitCode).toBe(0);
    expect((store as MemoryStore).publications.size).toBe(0);
  });

  it("reports skipped: not configured per platform without writing rows", async () => {
    const { apis, store, run } = setup({ env: {} });
    const report = await run();
    expect(apis.calls).toEqual([]);
    expect(outcomes(report)).toEqual({
      instagram: "skipped_not_configured",
      facebook: "skipped_not_configured",
      gbp: "skipped_not_configured",
    });
    expect((store as MemoryStore).publications.size).toBe(0);
  });

  it("each platform module reports what is missing, and is ready when configured", () => {
    const deps = { fetch: fakeApis().fetch, sleep: async () => {}, now: () => NOW, log: silentLog() };
    const empty = createPublishers(config({}), new MemoryStore(), deps);
    for (const publisher of Object.values(empty)) expect(publisher.notConfiguredReason()).toMatch(/not set|not true/);
    const full = createPublishers(config(FULL_ENV), new DurableMemoryStore(), deps);
    for (const publisher of Object.values(full)) expect(publisher.notConfiguredReason()).toBeNull();
    const gbpPending = createPublishers(config({ ...FULL_ENV, GBP_ENABLED: "false" }), new DurableMemoryStore(), deps);
    expect(gbpPending.gbp.notConfiguredReason()).toMatch(/waiting on Google/);
  });

  it("fails only when an unreachable Supabase blocks a due post", async () => {
    const paused = () => {
      const store = new DurableMemoryStore(() => NOW);
      store.upsertPosts = async () => {
        throw new Error("Supabase upsert social_posts failed: project paused");
      };
      return store;
    };
    const blocked = await setup({ env: { ...FULL_ENV, DRY_RUN: "false" }, store: paused() }).run();
    expect(blocked.exitCode).toBe(1);
    expect(blocked.alertLines).toHaveLength(1);
    const idle = await setup({ env: { ...FULL_ENV, DRY_RUN: "false" }, store: paused(), posts: [approvedPost({ status: "draft" })] }).run();
    expect(idle.exitCode).toBe(0);
    expect(idle.summary).toContain("Supabase is unreachable");
  });

  it("waits (without using an attempt) while media is not yet deployed", async () => {
    const { apis, store, run } = setup({ env: { ...FULL_ENV, DRY_RUN: "false" }, reachable: false });
    const report = await run();
    expect(Object.values(outcomes(report))).toEqual(["waiting_for_media", "waiting_for_media", "waiting_for_media"]);
    expect(apis.platformCalls()).toEqual([]);
    expect((store as MemoryStore).publications.size).toBe(0);
  });
});

describe("runPublish live", () => {
  const live = { ...FULL_ENV, DRY_RUN: "false" };

  it("publishes each platform and stores ids and permalinks", async () => {
    const { store, run } = setup({ env: live });
    const report = await run();
    expect(outcomes(report)).toEqual({ instagram: "published", facebook: "published", gbp: "published" });
    const rows = (store as MemoryStore).publications;
    expect(rows.get("2026-10-25-airport-delivery:instagram")).toMatchObject({ state: "published", platform_post_id: "ig_media_1", permalink: "https://www.instagram.com/p/abc/" });
    expect(rows.get("2026-10-25-airport-delivery:facebook")).toMatchObject({ platform_post_id: "111_999" });
    expect(rows.get("2026-10-25-airport-delivery:gbp")).toMatchObject({ permalink: "https://local.google.com/post/555" });
    expect(report.summary).toContain("Link-in-bio URLs");
  });

  it("never re-publishes a published pair", async () => {
    const { apis, run } = setup({ env: live });
    await run();
    const before = apis.calls.length;
    const report = await run({ now: new Date(NOW.getTime() + 3_600_000) });
    expect(apis.calls.length).toBe(before);
    expect(report.results).toEqual([]);
  });

  it("logs, but does not re-post, content edited after publishing", async () => {
    const store = new DurableMemoryStore(() => NOW);
    const first = setup({ env: live, store });
    await first.run();
    const edited = parse(baseFrontmatter({ platforms: { instagram: { type: "feed" } } }), { body: "A new caption." }).post!;
    const second = setup({ env: live, store, posts: [edited] });
    const report = await second.run();
    expect(second.apis.platformCalls()).toEqual([]);
    expect(second.log.lines.join("\n")).toContain("post file changed after it was published; not re-posted");
    expect(report.summary).toContain("edited after publish");
  });

  it("lets only one of two concurrent runs claim a pair", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const apis = fakeApis([[/\/111\/photos/, async () => (await gate, json({ id: "photo_1", post_id: "111_999" }))]]);
    const store = new DurableMemoryStore(() => NOW);
    const post = approvedPost({ platforms: { facebook: { type: "photo" } } });
    const a = setup({ env: live, store, apis, posts: [post] });
    const b = setup({ env: live, store, apis, posts: [post] });
    const runs = Promise.all([a.run(), b.run()]);
    await new Promise((resolve) => setTimeout(resolve, 10));
    release();
    const [first, second] = await runs;
    expect(apis.calls.filter((call) => call.url.includes("/111/photos"))).toHaveLength(1);
    expect([first.results[0].outcome, second.results[0].outcome].sort()).toEqual(["not_claimable", "published"]);
  });

  it("retries a definite failure after backoff, up to 3 attempts", async () => {
    const apis = fakeApis([[/\/111\/photos/, () => json({ error: { message: "Invalid parameter", code: 100 } }, 400)]]);
    const store = new DurableMemoryStore(() => clock);
    let clock = NOW;
    const post = approvedPost({ platforms: { facebook: { type: "photo" } } });
    const { run } = setup({ env: live, store, apis, posts: [post] });

    const first = await run();
    expect(first.results[0]).toMatchObject({ outcome: "failed", detail: expect.stringContaining("Invalid parameter") });
    expect(first.exitCode).toBe(0);

    expect((await run()).results[0].outcome).toBe("not_claimable"); // backoff
    clock = new Date(NOW.getTime() + 16 * 60_000);
    expect((await run({ now: clock })).results[0].outcome).toBe("failed");
    clock = new Date(NOW.getTime() + 50 * 60_000);
    const third = await run({ now: clock });
    expect(third.results[0].outcome).toBe("failed_final");
    expect(third.exitCode).toBe(1);
    expect(third.alertLines).toHaveLength(1);
    clock = new Date(NOW.getTime() + 10 * 3_600_000);
    expect((await run({ now: clock })).results).toEqual([]);
    expect(apis.calls.filter((call) => call.url.includes("/111/photos"))).toHaveLength(3);
  });

  it("never retries when the publish call's outcome is unknown", async () => {
    const apis = fakeApis([[/\/111\/photos/, () => { throw new TypeError("fetch failed (socket hang up)"); }]]);
    const store = new DurableMemoryStore(() => NOW);
    const { run } = setup({ env: live, store, apis, posts: [approvedPost({ platforms: { facebook: { type: "photo" } } })] });
    const report = await run();
    expect(report.results[0]).toMatchObject({ outcome: "failed_final", detail: expect.stringContaining("may have posted") });
    expect(store.publications.get("2026-10-25-airport-delivery:facebook")).toMatchObject({ state: "failed", attempts: 3 });
  });

  it("treats a failed permalink lookup as success (no double post)", async () => {
    const apis = fakeApis([[/111_999/, () => json({ error: { message: "boom" } }, 500)]]);
    const { run } = setup({ env: live, apis, posts: [approvedPost({ platforms: { facebook: { type: "photo" } } })] });
    const report = await run();
    expect(report.results[0]).toMatchObject({ outcome: "published", permalink: null });
  });
});

describe("TikTok privacy guard", () => {
  const initBody = (apis: ReturnType<typeof fakeApis>) =>
    JSON.parse(apis.calls.find((call) => call.url.includes("video/init"))!.body);

  it("forces SELF_ONLY when TIKTOK_AUDITED is not true", async () => {
    const apis = fakeApis();
    const { run } = setup({ env: { ...FULL_ENV, DRY_RUN: "false", TIKTOK_PULL_FROM_URL: "true" }, apis, posts: [videoPost()] });
    const report = await run();
    expect(report.results[0]).toMatchObject({ platform: "tiktok", outcome: "published" });
    expect(initBody(apis).post_info.privacy_level).toBe("SELF_ONLY");
    expect(initBody(apis).source_info).toEqual({ source: "PULL_FROM_URL", video_url: "https://rentwithheldy.com/social-media/clip.mp4" });
  });

  it("uses the requested privacy once audited", async () => {
    const apis = fakeApis();
    const { run } = setup({
      env: { ...FULL_ENV, DRY_RUN: "false", TIKTOK_AUDITED: "true", TIKTOK_PULL_FROM_URL: "true" },
      apis,
      posts: [videoPost()],
    });
    await run();
    expect(initBody(apis).post_info.privacy_level).toBe("PUBLIC_TO_EVERYONE");
  });

  it("stores the rotated refresh token", async () => {
    const store = new DurableMemoryStore(() => NOW);
    const { run } = setup({ env: { ...FULL_ENV, DRY_RUN: "false", TIKTOK_PULL_FROM_URL: "true" }, store, posts: [videoPost()] });
    await run();
    expect(store.tokens.get("tiktok")).toMatchObject({ refresh_token: "rft.rotated", access_token: "act.tiktok-access" });
  });

  it("resolvePrivacy and chunkPlan follow TikTok's rules", () => {
    expect(resolvePrivacy("PUBLIC_TO_EVERYONE", false)).toEqual({ privacy: "SELF_ONLY", forced: true });
    expect(resolvePrivacy("PUBLIC_TO_EVERYONE", true)).toEqual({ privacy: "PUBLIC_TO_EVERYONE", forced: false });
    expect(chunkPlan(3 * 1024 * 1024)).toEqual({ chunkSize: 3 * 1024 * 1024, totalChunks: 1 });
    expect(chunkPlan(25 * 1024 * 1024)).toEqual({ chunkSize: 10 * 1024 * 1024, totalChunks: 2 });
  });
});

describe("platform request shapes", () => {
  const root = makeRepo();
  const post = (platforms: Record<string, unknown>, media: string[], extra: Record<string, unknown> = {}) =>
    parse(baseFrontmatter({ platforms, media, ...extra }), { root }).post!;

  it("builds Instagram containers per post type", () => {
    expect(instagramContainers(post({ instagram: { type: "feed" } }, ["public/social-media/car.jpg"]))).toEqual({
      children: [],
      main: { image_url: "https://rentwithheldy.com/social-media/car.jpg", caption: expect.any(String) },
    });
    expect(instagramContainers(post({ instagram: { type: "reel" } }, ["public/social-media/clip.mp4"])).main).toMatchObject({
      media_type: "REELS",
      share_to_feed: "true",
    });
    const carousel = instagramContainers(post({ instagram: { type: "carousel" } }, ["public/social-media/car.jpg", "public/social-media/clip.mp4"]));
    expect(carousel.children).toEqual([
      { is_carousel_item: "true", image_url: "https://rentwithheldy.com/social-media/car.jpg" },
      { is_carousel_item: "true", media_type: "VIDEO", video_url: "https://rentwithheldy.com/social-media/clip.mp4" },
    ]);
    expect(carousel.main).toMatchObject({ media_type: "CAROUSEL" });
    const story = instagramContainers(post({ instagram: { type: "story" } }, ["public/social-media/car.jpg"]));
    expect(story.main).toEqual({ media_type: "STORIES", image_url: "https://rentwithheldy.com/social-media/car.jpg" });
  });

  it("puts the UTM link in Facebook link posts and Google CTAs", () => {
    const fb = facebookRequest(post({ facebook: { type: "link" } }, []));
    expect(fb.edge).toBe("feed");
    expect(fb.params.link).toBe(
      "https://rentwithheldy.com/fort-lauderdale-airport-car-rental?utm_source=facebook&utm_medium=social&utm_campaign=fll-delivery-oct&utm_content=2026-10-25-airport-delivery",
    );
    const gbp = gbpLocalPost(post({ gbp: { type: "STANDARD", cta: "BOOK" } }, ["public/social-media/car.jpg"]), "America/New_York");
    expect(gbp).toMatchObject({
      topicType: "STANDARD",
      callToAction: { actionType: "BOOK", url: expect.stringContaining("utm_source=gbp") },
      media: [{ mediaFormat: "PHOTO", sourceUrl: "https://rentwithheldy.com/social-media/car.jpg" }],
    });
    const call = gbpLocalPost(post({ gbp: { type: "STANDARD", cta: "CALL" } }, []), "America/New_York");
    expect(call.callToAction).toEqual({ actionType: "CALL" });
  });

  it("converts GBP event times to the business timezone", () => {
    const event = gbpLocalPost(
      post(
        { gbp: { type: "EVENT", event: { title: "Cruise weekend", start: "2026-11-06T13:00:00Z", end: "2026-11-08T22:00:00Z" } } },
        [],
      ),
      "America/New_York",
    ).event as { schedule: { startDate: unknown; startTime: unknown; endTime: { hours: number } } };
    expect(event.schedule.startDate).toEqual({ year: 2026, month: 11, day: 6 });
    expect(event.schedule.startTime).toEqual({ hours: 8, minutes: 0, seconds: 0, nanos: 0 }); // EST after Nov 1
    expect(event.schedule.endTime.hours).toBe(17);
  });
});
