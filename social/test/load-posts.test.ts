// @vitest-environment node
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadPosts } from "../src/load-posts.js";
import { FrontmatterSchema } from "../src/schema.js";
import { baseFrontmatter, jpegHeader, makeRepo, MEDIA_BASE, parse, postText } from "./helpers.js";

const errors = (result: ReturnType<typeof parse>) =>
  result.issues.filter((issue) => issue.level === "error").map((issue) => issue.message);
const warnings = (result: ReturnType<typeof parse>) =>
  result.issues.filter((issue) => issue.level === "warning").map((issue) => issue.message);

const valid = () =>
  baseFrontmatter({
    platforms: { instagram: { type: "feed" }, facebook: { type: "photo" }, gbp: { type: "STANDARD", cta: "LEARN_MORE" } },
  });

describe("post validation", () => {
  it("accepts a valid approved post and resolves media to the public site URL", () => {
    const result = parse(valid());
    expect(errors(result)).toEqual([]);
    expect(result.post?.platformList).toEqual(["instagram", "facebook", "gbp"]);
    expect(result.post?.media[0].publicUrl).toBe(`${MEDIA_BASE}/social-media/car.jpg`);
    expect(result.post?.media[0]).toMatchObject({ width: 1080, height: 1350, kind: "image" });
    expect(result.post?.scheduledAt.toISOString()).toBe("2026-10-25T14:00:00.000Z");
  });

  it("rejects scheduled_at without a timezone offset", () => {
    const result = parse({ ...valid(), scheduled_at: "2026-10-25T10:00:00" });
    expect(result.post).toBeUndefined();
    expect(errors(result).join()).toMatch(/scheduled_at must be ISO 8601 with a timezone offset/);
  });

  it("rejects an unknown platform", () => {
    const result = parse({ ...valid(), platforms: { myspace: { type: "feed" } } });
    expect(errors(result).join()).toMatch(/Unrecognized key\(s\) in object: 'myspace'/);
  });

  it("rejects an approved post whose media is missing", () => {
    const result = parse({ ...valid(), media: ["public/social-media/nope.jpg"] });
    expect(errors(result)).toContain('media "public/social-media/nope.jpg": file not found');
  });

  it("only warns about missing media while the post is a draft", () => {
    const result = parse({ ...valid(), status: "draft", media: ["public/social-media/nope.jpg"] });
    expect(errors(result)).toEqual([]);
    expect(warnings(result).join()).toMatch(/file not found/);
  });

  it("rejects media outside public/social-media and non-https URLs", () => {
    expect(errors(parse({ ...valid(), media: ["src/assets/car.jpg"] })).join()).toMatch(/must live in public\/social-media/);
    expect(errors(parse({ ...valid(), media: ["http://example.com/car.jpg"] })).join()).toMatch(/must use https/);
  });

  it("rejects a caption over a platform limit", () => {
    const result = parse(valid(), { body: "a".repeat(1501) });
    expect(errors(result).join()).toMatch(/gbp: text is 1501 characters \(max 1500\)/);
    const instagram = parse({ ...valid(), platforms: { instagram: { type: "feed" } } }, { body: "b".repeat(2201) });
    expect(errors(instagram).join()).toMatch(/instagram: caption is 2201 characters \(max 2200\)/);
  });

  it("uses per-platform overrides for length checks", () => {
    const result = parse({ ...valid(), overrides: { gbp: "Short for Google." } }, { body: "a".repeat(1600) });
    expect(errors(result)).toEqual([]);
    expect(result.post?.captions.gbp).toBe("Short for Google.");
  });

  it("rejects duplicate ids across files", () => {
    const root = makeRepo();
    // ids must match file names, so the way to collide is x.md next to _x.md.
    writeFileSync(path.join(root, "social/posts/2026-10-25-airport-delivery.md"), postText(valid()));
    writeFileSync(path.join(root, "social/posts/_2026-10-25-airport-delivery.md"), postText({ ...valid(), status: "draft" }));
    const { posts, issues } = loadPosts({ repoRoot: root, mediaBaseUrl: MEDIA_BASE });
    expect(posts).toEqual([]);
    expect(issues.map((issue) => issue.message).join()).toMatch(/duplicate id "2026-10-25-airport-delivery"/);
  });

  it("requires the id to match the file name", () => {
    const result = parse(valid(), { file: "social/posts/something-else.md" });
    expect(errors(result).join()).toMatch(/must match the file name "something-else"/);
  });

  it("warns (does not fail) on em dashes", () => {
    const result = parse(valid(), { body: "Skip the counter — we bring the car." });
    expect(errors(result)).toEqual([]);
    expect(warnings(result).join()).toMatch(/em dash/);
  });

  it("enforces platform media rules", () => {
    expect(errors(parse({ ...valid(), platforms: { tiktok: { type: "video" } } })).join()).toMatch(/tiktok: needs exactly 1 video/);
    expect(errors(parse({ ...valid(), platforms: { instagram: { type: "reel" } } })).join()).toMatch(/instagram reel: needs exactly 1 video/);
    expect(
      errors(parse({ ...valid(), platforms: { instagram: { type: "carousel" } } })).join(),
    ).toMatch(/instagram carousel: needs 2 to 10/);
    expect(errors(parse({ ...valid(), platforms: { facebook: { type: "link" } }, link: undefined, media: [] })).join()).toMatch(
      /facebook link: needs a link/,
    );
  });

  it("checks Instagram aspect ratio, JPEG-only and size", () => {
    const root = makeRepo({
      "public/social-media/tall.jpg": jpegHeader(1080, 1920),
      "public/social-media/photo.png": Buffer.from("89504e470d0a1a0a0000000d49484452000004380000043808020000", "hex"),
      "public/social-media/huge.jpg": jpegHeader(1080, 1350, 9 * 1024 * 1024),
    });
    const ig = (media: string) => errors(parse({ ...valid(), platforms: { instagram: { type: "feed" } }, media: [media] }, { root })).join();
    expect(ig("public/social-media/tall.jpg")).toMatch(/1080x1920 .*between 4:5/);
    expect(ig("public/social-media/photo.png")).toMatch(/must be a JPEG/);
    expect(ig("public/social-media/huge.jpg")).toMatch(/max 8 MB/);
  });

  it("requires event details for GBP EVENT and OFFER posts", () => {
    const result = parse({ ...valid(), platforms: { gbp: { type: "OFFER" } } });
    expect(errors(result).join()).toMatch(/gbp OFFER: needs platforms.gbp.event/);
  });

  it("requires at least one platform when approved", () => {
    expect(errors(parse({ ...valid(), platforms: {} })).join()).toMatch(/at least one platform/);
  });

  it("never allows example files to be approved", () => {
    const result = parse({ ...valid(), id: "example-draft" }, { file: "social/posts/_example-draft.md" });
    expect(errors(result).join()).toMatch(/can never be approved/);
  });

  it("changes the content hash when the caption changes, not when status changes", () => {
    const a = parse(valid()).post!;
    const b = parse({ ...valid(), status: "draft" }).post!;
    const c = parse(valid(), { body: "Different caption." }).post!;
    expect(a.contentHash).toBe(b.contentHash);
    expect(a.contentHash).not.toBe(c.contentHash);
  });

  it("keeps post.schema.json in step with the zod schema", () => {
    const json = JSON.parse(readFileSync(path.join(__dirname, "../schema/post.schema.json"), "utf8"));
    expect(Object.keys(json.properties).sort()).toEqual(Object.keys(FrontmatterSchema.shape).sort());
    expect(Object.keys(json.properties.platforms.properties).sort()).toEqual(["facebook", "gbp", "instagram", "tiktok"]);
  });

  it("validates the committed post files", () => {
    const repoRoot = path.join(__dirname, "../..");
    const { issues } = loadPosts({ repoRoot, mediaBaseUrl: MEDIA_BASE });
    expect(issues.filter((issue) => issue.level === "error")).toEqual([]);
  });
});
