// @vitest-environment node
import { describe, expect, it } from "vitest";
import { selectDue } from "../src/select-due.js";
import type { PublicationRow } from "../src/store.js";
import { approvedPost } from "./helpers.js";

const scheduled = new Date("2026-10-25T14:00:00Z");
const at = (offsetHours: number) => new Date(scheduled.getTime() + offsetHours * 3_600_000);

const row = (overrides: Partial<PublicationRow>): PublicationRow => ({
  post_id: "2026-10-25-airport-delivery",
  platform: "instagram",
  state: "published",
  attempts: 1,
  content_hash: null,
  platform_post_id: "1",
  permalink: null,
  published_at: scheduled.toISOString(),
  last_error: null,
  updated_at: scheduled.toISOString(),
  ...overrides,
});

const pairs = (list: Array<{ post: { id: string }; platform: string }>) => list.map(({ post, platform }) => `${post.id}:${platform}`);

describe("selectDue", () => {
  const post = approvedPost();

  it("selects every platform of an approved post once it is due", () => {
    expect(pairs(selectDue([post], [], { now: at(0) }).due)).toEqual([
      `${post.id}:instagram`,
      `${post.id}:facebook`,
      `${post.id}:gbp`,
    ]);
  });

  it("waits for the scheduled time", () => {
    expect(selectDue([post], [], { now: at(-0.01) }).due).toEqual([]);
  });

  it("ignores drafts, cancelled posts and templates", () => {
    const draft = approvedPost({ status: "draft" });
    const cancelled = approvedPost({ status: "cancelled" });
    const template = { ...post, isTemplate: true };
    expect(selectDue([draft, cancelled, template], [], { now: at(1) }).due).toEqual([]);
  });

  it("does not auto-publish posts more than 48h late, but reports them", () => {
    const result = selectDue([post], [], { now: at(49) });
    expect(result.due).toEqual([]);
    expect(result.stale).toHaveLength(3);
    expect(selectDue([post], [], { now: at(47.9) }).due).toHaveLength(3);
    // After a week stale posts drop out of the report.
    expect(selectDue([post], [], { now: at(24 * 8) }).stale).toEqual([]);
  });

  it("lets a manual run for one post_id lift the stale window", () => {
    const other = approvedPost({ id: "other-post" });
    const result = selectDue([post, other], [], { now: at(100), postId: post.id });
    expect(pairs(result.due)).toEqual([`${post.id}:instagram`, `${post.id}:facebook`, `${post.id}:gbp`]);
  });

  it("never re-selects a published pair", () => {
    const result = selectDue([post], [row({ content_hash: post.contentHash })], { now: at(1) });
    expect(pairs(result.due)).toEqual([`${post.id}:facebook`, `${post.id}:gbp`]);
    expect(result.editedAfterPublish).toEqual([]);
  });

  it("reports (does not re-post) content edited after publishing", () => {
    const result = selectDue([post], [row({ content_hash: "older-hash" })], { now: at(1) });
    expect(pairs(result.due)).not.toContain(`${post.id}:instagram`);
    expect(pairs(result.editedAfterPublish)).toEqual([`${post.id}:instagram`]);
  });

  it("stops after 3 failed attempts and flags stuck or owner-skipped pairs", () => {
    const result = selectDue(
      [post],
      [
        row({ state: "failed", attempts: 3 }),
        row({ platform: "facebook", state: "publishing", updated_at: at(-2).toISOString() }),
        row({ platform: "gbp", state: "skipped" }),
      ],
      { now: at(1) },
    );
    expect(result.due).toEqual([]);
    expect(pairs(result.exhausted)).toEqual([`${post.id}:instagram`]);
    expect(pairs(result.stuck)).toEqual([`${post.id}:facebook`]);
  });

  it("keeps failed pairs with attempts left and dry_run pairs selectable", () => {
    const result = selectDue([post], [row({ state: "failed", attempts: 2 }), row({ platform: "facebook", state: "dry_run" })], {
      now: at(1),
    });
    expect(result.due).toHaveLength(3);
  });
});
