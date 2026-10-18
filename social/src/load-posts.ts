// Parses and validates social/posts/*.md. Invalid files are reported and
// skipped; they never stop other posts from loading.

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { PLATFORMS, type Platform } from "./config.js";
import { BANNED_IN_GUEST_COPY, LIMITS } from "./limits.js";
import { MediaError, resolveMedia, type MediaItem } from "./media.js";
import { FrontmatterSchema, type Frontmatter, type PlatformSettings } from "./schema.js";

export const POSTS_DIR = "social/posts";

export interface SocialPost {
  id: string;
  status: Frontmatter["status"];
  scheduledAt: Date;
  scheduledAtRaw: string;
  /** Repo-relative path, e.g. social/posts/2026-10-25-airport-delivery.md */
  filePath: string;
  platforms: PlatformSettings;
  platformList: Platform[];
  captions: Record<Platform, string>;
  media: MediaItem[];
  link: string | null;
  utmCampaign: string;
  /** Hash of everything that would be published; detects edits after publish. */
  contentHash: string;
  /** Files starting with "_" are examples/templates and never publish. */
  isTemplate: boolean;
}

export interface Issue {
  file: string;
  level: "error" | "warning";
  message: string;
}

export interface LoadResult {
  posts: SocialPost[];
  issues: Issue[];
}

export interface LoadOptions {
  repoRoot: string;
  mediaBaseUrl: string;
  postsDir?: string;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

const utf16Length = (text: string) => text.length;
const charLength = (text: string) => [...text].length;
const hashtagCount = (text: string) => (text.match(/(^|\s)#[\p{L}\p{N}_]+/gu) ?? []).length;

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/** Platform rules. Returned as messages; the caller decides error vs warning. */
export function platformProblems(
  platforms: PlatformSettings,
  captions: Record<Platform, string>,
  media: MediaItem[],
  link: string | null,
): string[] {
  const problems: string[] = [];
  const images = media.filter((item) => item.kind === "image");
  const videos = media.filter((item) => item.kind === "video");

  const ig = platforms.instagram;
  if (ig) {
    const caption = captions.instagram;
    const limits = LIMITS.instagram;
    if (charLength(caption) > limits.captionChars) {
      problems.push(`instagram: caption is ${charLength(caption)} characters (max ${limits.captionChars})`);
    }
    if (hashtagCount(caption) > limits.hashtags) {
      problems.push(`instagram: caption has ${hashtagCount(caption)} hashtags (max ${limits.hashtags})`);
    }
    if (ig.type === "feed" && media.length !== 1) {
      problems.push(
        `instagram feed: needs exactly 1 image or video (found ${media.length})${media.length > 1 ? "; use type: carousel for more" : ""}`,
      );
    }
    if (ig.type === "carousel" && (media.length < limits.carouselMin || media.length > limits.carouselMax)) {
      problems.push(
        `instagram carousel: needs ${limits.carouselMin} to ${limits.carouselMax} images or videos (found ${media.length})`,
      );
    }
    if (ig.type === "reel" && (media.length !== 1 || videos.length !== 1)) {
      problems.push("instagram reel: needs exactly 1 video (.mp4 or .mov)");
    }
    if (ig.type === "story" && media.length !== 1) {
      problems.push(`instagram story: needs exactly 1 image or video (found ${media.length})`);
    }
    for (const item of images) {
      if (!(limits.imageMimes as readonly string[]).includes(item.mime)) {
        problems.push(`instagram: ${item.source} must be a JPEG (.jpg); Instagram's API does not accept ${item.mime}`);
      }
      if (item.bytes !== null && item.bytes > limits.imageMaxBytes) {
        problems.push(`instagram: ${item.source} is ${(item.bytes / 1048576).toFixed(1)} MB (max 8 MB for images)`);
      }
      if ((ig.type === "feed" || ig.type === "carousel") && item.width && item.height) {
        const ratio = item.width / item.height;
        if (ratio < limits.feedAspectMin - 0.005 || ratio > limits.feedAspectMax + 0.005) {
          problems.push(
            `instagram: ${item.source} is ${item.width}x${item.height} (ratio ${ratio.toFixed(2)}); feed images must be between 4:5 (0.80) and 1.91:1`,
          );
        }
      }
    }
    for (const item of videos) {
      const max = ig.type === "story" ? limits.storyVideoMaxBytes : limits.videoMaxBytes;
      if (item.bytes !== null && item.bytes > max) {
        problems.push(`instagram: ${item.source} is ${(item.bytes / 1048576).toFixed(0)} MB (max ${max / 1048576} MB)`);
      }
    }
  }

  const fb = platforms.facebook;
  if (fb) {
    if (charLength(captions.facebook) > LIMITS.facebook.captionChars) {
      problems.push(`facebook: text is longer than ${LIMITS.facebook.captionChars} characters`);
    }
    if (fb.type === "photo" && (media.length !== 1 || images.length !== 1)) {
      problems.push("facebook photo: needs exactly 1 image");
    }
    if (fb.type === "video" && (media.length !== 1 || videos.length !== 1)) {
      problems.push("facebook video: needs exactly 1 video");
    }
    if (fb.type === "link" && !link) problems.push("facebook link: needs a link");
    if ((fb.type === "link" || fb.type === "text") && media.length > 0) {
      problems.push(`facebook ${fb.type}: media is not used for ${fb.type} posts; use type: photo or video`);
    }
  }

  const tt = platforms.tiktok;
  if (tt) {
    if (media.length !== 1 || videos.length !== 1) problems.push("tiktok: needs exactly 1 video (.mp4 or .mov)");
    if (utf16Length(captions.tiktok) > LIMITS.tiktok.titleUtf16) {
      problems.push(`tiktok: caption is longer than ${LIMITS.tiktok.titleUtf16} characters`);
    }
    for (const item of videos) {
      if (item.bytes !== null && item.bytes > LIMITS.tiktok.videoMaxBytes) problems.push(`tiktok: ${item.source} is over 4 GB`);
    }
  }

  const gbp = platforms.gbp;
  if (gbp) {
    if (charLength(captions.gbp) > LIMITS.gbp.summaryChars) {
      problems.push(
        `gbp: text is ${charLength(captions.gbp)} characters (max ${LIMITS.gbp.summaryChars}); add a shorter overrides.gbp`,
      );
    }
    if (media.length > 1) problems.push("gbp: Google posts take at most 1 photo; put the photo first and drop the rest via a separate post");
    if (videos.length > 0) problems.push("gbp: video posts are not supported by this pipeline; use a photo");
    for (const item of images) {
      if (!(LIMITS.gbp.imageMimes as readonly string[]).includes(item.mime)) problems.push(`gbp: ${item.source} must be JPEG or PNG`);
    }
    if ((gbp.type === "EVENT" || gbp.type === "OFFER") && !gbp.event) {
      problems.push(`gbp ${gbp.type}: needs platforms.gbp.event with title, start and end`);
    }
    if (gbp.event && Date.parse(gbp.event.end) <= Date.parse(gbp.event.start)) {
      problems.push("gbp: event.end must be after event.start");
    }
    if (gbp.type !== "OFFER" && gbp.offer) problems.push("gbp: offer fields only apply to type: OFFER");
    if (gbp.cta && gbp.cta !== "CALL" && !link) problems.push(`gbp: cta ${gbp.cta} needs a link`);
  }

  return problems;
}

export function parsePostText(text: string, filePath: string, options: LoadOptions): { post?: SocialPost; issues: Issue[] } {
  const issues: Issue[] = [];
  const error = (message: string) => issues.push({ file: filePath, level: "error", message });
  const warn = (message: string) => issues.push({ file: filePath, level: "warning", message });

  const match = FRONTMATTER.exec(text);
  if (!match) {
    error("missing YAML frontmatter (the file must start with a --- block)");
    return { issues };
  }

  let raw: unknown;
  try {
    raw = parseYaml(match[1]);
  } catch (parseError) {
    error(`frontmatter is not valid YAML: ${parseError instanceof Error ? parseError.message.split("\n")[0] : parseError}`);
    return { issues };
  }

  const parsed = FrontmatterSchema.safeParse(raw ?? {});
  if (!parsed.success) {
    for (const problem of parsed.error.issues) {
      error(`${problem.path.join(".") || "frontmatter"}: ${problem.message}`);
    }
    return { issues };
  }
  const fm = parsed.data;

  const stem = path.basename(filePath, path.extname(filePath));
  const isTemplate = stem.startsWith("_");
  if (fm.id !== stem.replace(/^_/, "")) error(`id "${fm.id}" must match the file name "${stem.replace(/^_/, "")}"`);
  if (isTemplate && fm.status === "approved") error("example files (starting with _) can never be approved");

  const body = match[2].trim();
  const captions = Object.fromEntries(
    PLATFORMS.map((platform) => [platform, (fm.overrides[platform] ?? body).trim()]),
  ) as Record<Platform, string>;
  const platformList = PLATFORMS.filter((platform) => fm.platforms[platform]);

  const approved = fm.status === "approved";
  const media: MediaItem[] = [];
  for (const source of fm.media) {
    try {
      media.push(resolveMedia(source, options.repoRoot, options.mediaBaseUrl));
    } catch (mediaError) {
      if (!(mediaError instanceof MediaError)) throw mediaError;
      // A draft may name a photo that has not been added yet.
      (approved ? error : warn)(mediaError.message);
    }
  }

  if (approved && platformList.length === 0) error("approved posts need at least one platform");
  for (const platform of platformList) {
    if (!captions[platform]) error(`${platform}: caption is empty (write it below the frontmatter or in overrides)`);
  }
  const problems = platformProblems(fm.platforms, captions, media, fm.link ?? null);
  // Drafts can be work in progress; the same rules become errors on approval.
  for (const problem of problems) (approved ? error : warn)(problem);

  for (const platform of platformList) {
    if (BANNED_IN_GUEST_COPY.test(captions[platform])) {
      warn(`${platform}: caption contains an em dash (—); the brand guide bans them in guest copy`);
    }
  }
  if (fm.platforms.tiktok && fm.platforms.tiktok.privacy !== "SELF_ONLY") {
    warn("tiktok: privacy is forced to SELF_ONLY until TIKTOK_AUDITED=true");
  }

  if (issues.some((issue) => issue.level === "error")) return { issues };

  const contentHash = createHash("sha256")
    .update(
      stableJson({
        captions: Object.fromEntries(platformList.map((platform) => [platform, captions[platform]])),
        platforms: fm.platforms,
        media: fm.media,
        link: fm.link ?? null,
      }),
    )
    .digest("hex");

  return {
    issues,
    post: {
      id: fm.id,
      status: fm.status,
      scheduledAt: new Date(fm.scheduled_at),
      scheduledAtRaw: fm.scheduled_at,
      filePath,
      platforms: fm.platforms,
      platformList,
      captions,
      media,
      link: fm.link ?? null,
      utmCampaign: fm.utm_campaign ?? fm.id,
      contentHash,
      isTemplate,
    },
  };
}

export function loadPosts(options: LoadOptions): LoadResult {
  const postsDir = options.postsDir ?? POSTS_DIR;
  const absoluteDir = path.join(options.repoRoot, postsDir);
  let files: string[];
  try {
    files = readdirSync(absoluteDir).filter((name) => name.endsWith(".md")).sort();
  } catch {
    return { posts: [], issues: [] };
  }

  const posts: SocialPost[] = [];
  const issues: Issue[] = [];
  const seen = new Map<string, string>();

  for (const name of files) {
    const filePath = `${postsDir}/${name}`;
    const text = readFileSync(path.join(absoluteDir, name), "utf8");
    const result = parsePostText(text, filePath, options);
    issues.push(...result.issues);
    if (!result.post) continue;
    const duplicate = seen.get(result.post.id);
    if (duplicate) {
      issues.push({ file: filePath, level: "error", message: `duplicate id "${result.post.id}" (also used by ${duplicate})` });
      // Neither copy is safe to publish when two files claim one id.
      const index = posts.findIndex((post) => post.id === result.post!.id);
      if (index >= 0) posts.splice(index, 1);
      continue;
    }
    seen.set(result.post.id, filePath);
    posts.push(result.post);
  }
  return { posts, issues };
}
