import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { stringify } from "yaml";
import { loadConfig, type Env } from "../src/config.js";
import { parsePostText, type SocialPost } from "../src/load-posts.js";
import { MemoryStore } from "../src/store.js";

export const MEDIA_BASE = "https://rentwithheldy.com";

/** Minimal JPEG header (SOI + SOF0) with the given size; enough for dimension parsing. */
export function jpegHeader(width: number, height: number, padBytes = 0) {
  const sof = Buffer.from([
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08,
    (height >> 8) & 0xff, height & 0xff, (width >> 8) & 0xff, width & 0xff,
    0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
  ]);
  return Buffer.concat([sof, Buffer.alloc(padBytes)]);
}

export function makeRepo(files: Record<string, Buffer | string> = {}) {
  const root = mkdtempSync(path.join(tmpdir(), "rwh-social-"));
  mkdirSync(path.join(root, "social/posts"), { recursive: true });
  mkdirSync(path.join(root, "public/social-media"), { recursive: true });
  const defaults: Record<string, Buffer | string> = {
    "public/social-media/car.jpg": jpegHeader(1080, 1350),
    "public/social-media/wide.jpg": jpegHeader(1080, 1080),
    "public/social-media/clip.mp4": Buffer.alloc(1024),
    ...files,
  };
  for (const [name, content] of Object.entries(defaults)) writeFileSync(path.join(root, name), content);
  return root;
}

export function postText(frontmatter: Record<string, unknown>, body = "Skip the rental counter at FLL. Tell us your flight.") {
  return `---\n${stringify(frontmatter)}---\n\n${body}\n`;
}

export const baseFrontmatter = (overrides: Record<string, unknown> = {}) => ({
  id: "2026-10-25-airport-delivery",
  status: "approved",
  scheduled_at: "2026-10-25T10:00:00-04:00",
  platforms: {
    instagram: { type: "feed" },
    facebook: { type: "photo" },
    tiktok: { type: "video" },
    gbp: { type: "STANDARD", cta: "LEARN_MORE" },
  },
  media: ["public/social-media/car.jpg"],
  link: "https://rentwithheldy.com/fort-lauderdale-airport-car-rental",
  utm_campaign: "fll-delivery-oct",
  ...overrides,
});

export function parse(frontmatter: Record<string, unknown>, options: { body?: string; root?: string; file?: string } = {}) {
  const root = options.root ?? makeRepo();
  const file = options.file ?? `social/posts/${frontmatter.id}.md`;
  return parsePostText(postText(frontmatter, options.body), file, { repoRoot: root, mediaBaseUrl: MEDIA_BASE });
}

/** A valid approved post for publisher tests (one image; TikTok gets its own video post). */
export function approvedPost(overrides: Record<string, unknown> = {}): SocialPost {
  const { post, issues } = parse(
    baseFrontmatter({
      platforms: { instagram: { type: "feed" }, facebook: { type: "photo" }, gbp: { type: "STANDARD", cta: "LEARN_MORE" } },
      ...overrides,
    }),
  );
  if (!post) throw new Error(`fixture invalid: ${issues.map((issue) => issue.message).join("; ")}`);
  return post;
}

export function videoPost(overrides: Record<string, unknown> = {}): SocialPost {
  return approvedPost({
    id: "2026-10-26-tiktok-clip",
    platforms: { tiktok: { type: "video", privacy: "PUBLIC_TO_EVERYONE" } },
    media: ["public/social-media/clip.mp4"],
    ...overrides,
  });
}

/** MemoryStore that claims to be durable, so live-mode logic can be exercised. */
export class DurableMemoryStore extends MemoryStore {
  // @ts-expect-error overriding the readonly literal for tests
  readonly durable = true;
}

export const silentLog = () => {
  const lines: string[] = [];
  const push = (prefix: string) => (message: string) => lines.push(`${prefix}${message}`);
  return { lines, info: push(""), warn: push("WARN "), error: push("ERROR ") };
};

export function config(env: Env = {}) {
  return loadConfig({ GITHUB_ACTIONS: "false", ...env });
}

export const FULL_ENV: Env = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_test_value_123",
  FB_PAGE_ID: "111",
  FB_PAGE_ACCESS_TOKEN: "EAAG-page-token-secret",
  IG_USER_ID: "222",
  TIKTOK_CLIENT_KEY: "tt-client-key",
  TIKTOK_CLIENT_SECRET: "tt-client-secret-value",
  TIKTOK_REFRESH_TOKEN: "rft.tiktok-refresh-token",
  GBP_ENABLED: "true",
  GBP_CLIENT_ID: "gbp-client-id",
  GBP_CLIENT_SECRET: "gbp-client-secret",
  GBP_REFRESH_TOKEN: "1//gbp-refresh-token",
  GBP_ACCOUNT_ID: "333",
  GBP_LOCATION_ID: "444",
};
