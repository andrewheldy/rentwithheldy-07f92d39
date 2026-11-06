// @vitest-environment node
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { MemoryStore } from "../src/store.js";
import { handleWebhookGet, handleWebhookPost, parseMetaEvents, tagEvent, verifySignature } from "../src/webhook.js";
import { silentLog } from "./helpers.js";

const SECRET = "meta-app-secret-for-tests";
const VERIFY = "verify-token-for-tests";
const env = { META_APP_SECRET: SECRET, META_WEBHOOK_VERIFY_TOKEN: VERIFY };
const sign = (body: string, secret = SECRET) => `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

const igComment = {
  object: "instagram",
  entry: [
    {
      id: "17841400000000000",
      time: 1761400000,
      changes: [
        { field: "comments", value: { id: "c1", text: "How much to rent for a week from FLL?", from: { id: "u1", username: "guest_one" }, media: { id: "m1" } } },
        { field: "mentions", value: { media_id: "m2", comment_id: "c2" } },
      ],
      messaging: [
        { sender: { id: "s1" }, recipient: { id: "r1" }, timestamp: 1761400000123, message: { mid: "mid.1", text: "Hi! Is the Q5 available Friday?" } },
        { sender: { id: "r1" }, recipient: { id: "s1" }, timestamp: 1761400000999, message: { mid: "mid.2", text: "Our reply", is_echo: true } },
      ],
    },
  ],
};

const pageFeed = {
  object: "page",
  entry: [
    {
      id: "111",
      time: 1761400000,
      changes: [
        { field: "feed", value: { item: "comment", verb: "add", comment_id: "111_9_77", post_id: "111_9", message: "Love this!", from: { id: "u9", name: "A Guest" }, created_time: 1761400001 } },
        { field: "feed", value: { item: "comment", verb: "add", comment_id: "111_9_78", post_id: "111_9", message: "Thanks!", from: { id: "111", name: "Rent With Heldy" } } },
        { field: "feed", value: { item: "comment", verb: "remove", comment_id: "111_9_79", post_id: "111_9" } },
      ],
    },
  ],
};

const post = (body: string, headers: Record<string, string> = {}) =>
  new Request("https://rentwithheldy.com/api/meta-webhook", { method: "POST", body, headers: { "content-type": "application/json", ...headers } });

describe("Meta webhook handshake", () => {
  it("echoes the challenge for the right verify token", async () => {
    const url = `https://rentwithheldy.com/api/meta-webhook?hub.mode=subscribe&hub.verify_token=${VERIFY}&hub.challenge=12345`;
    const response = await handleWebhookGet(new Request(url), { env, store: null, log: silentLog() });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("12345");
  });

  it("rejects a wrong token, wrong mode, or missing configuration", async () => {
    const deps = { env, store: null, log: silentLog() };
    const wrong = await handleWebhookGet(new Request("https://x/api?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=1"), deps);
    expect(wrong.status).toBe(403);
    const mode = await handleWebhookGet(new Request(`https://x/api?hub.mode=unsubscribe&hub.verify_token=${VERIFY}&hub.challenge=1`), deps);
    expect(mode.status).toBe(403);
    const unconfigured = await handleWebhookGet(new Request(`https://x/api?hub.mode=subscribe&hub.verify_token=${VERIFY}&hub.challenge=1`), {
      ...deps,
      env: {},
    });
    expect(unconfigured.status).toBe(403);
  });
});

describe("Meta webhook events", () => {
  it("accepts a valid signature and stores parsed events", async () => {
    const store = new MemoryStore();
    const body = JSON.stringify(igComment);
    const response = await handleWebhookPost(post(body, { "x-hub-signature-256": sign(body) }), { env, store, log: silentLog() });
    expect(response.status).toBe(200);
    expect([...store.events.keys()]).toEqual(["instagram:comment:c1", "instagram:mention:comment:c2", "instagram:message:mid.1"]);
    expect(store.events.get("instagram:comment:c1")).toMatchObject({ author: "guest_one", tags: ["inquiry"], occurred_at: "2025-10-25T13:46:40.000Z" });
  });

  it("rejects an invalid or missing signature", async () => {
    const store = new MemoryStore();
    const body = JSON.stringify(igComment);
    const deps = { env, store, log: silentLog() };
    expect((await handleWebhookPost(post(body, { "x-hub-signature-256": sign(body, "wrong-secret") }), deps)).status).toBe(401);
    expect((await handleWebhookPost(post(body), deps)).status).toBe(401);
    // A body altered after signing fails too.
    expect((await handleWebhookPost(post(body.replace("guest_one", "guest_two"), { "x-hub-signature-256": sign(body) }), deps)).status).toBe(401);
    expect(store.events.size).toBe(0);
  });

  it("signs the exact raw bytes, including non-ASCII text", () => {
    const body = JSON.stringify({ text: "¡Hola! Llegamos a FLL 🚗" });
    expect(verifySignature(new TextEncoder().encode(body), sign(body), SECRET)).toBe(true);
  });

  it("dedupes repeated deliveries", async () => {
    const store = new MemoryStore();
    const body = JSON.stringify(igComment);
    const deps = { env, store, log: silentLog() };
    await handleWebhookPost(post(body, { "x-hub-signature-256": sign(body) }), deps);
    await handleWebhookPost(post(body, { "x-hub-signature-256": sign(body) }), deps);
    expect(store.events.size).toBe(3);
  });

  it("answers 503 (not configured) without an app secret, and 200 when storage is down", async () => {
    const body = JSON.stringify(igComment);
    expect((await handleWebhookPost(post(body), { env: {}, store: null, log: silentLog() })).status).toBe(503);
    const broken = new MemoryStore();
    broken.insertEvents = async () => {
      throw new Error("project paused");
    };
    const log = silentLog();
    const response = await handleWebhookPost(post(body, { "x-hub-signature-256": sign(body) }), { env, store: broken, log });
    expect(response.status).toBe(200);
    expect(log.lines.join()).toContain("could not store 3 event(s)");
  });

  it("parses Page feed comments and skips the Page's own replies and removals", () => {
    const rows = parseMetaEvents(pageFeed);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ platform: "facebook", event_type: "comment", external_id: "comment:111_9_77", author: "A Guest", tags: [] });
  });

  it("tags rental inquiries", () => {
    expect(tagEvent("Do you deliver to Port Everglades?")).toEqual(["inquiry"]);
    expect(tagEvent("What's the price for a weekend?")).toEqual(["inquiry"]);
    expect(tagEvent("Great photo!")).toEqual([]);
  });

  it("the Vercel function wires GET and POST", async () => {
    const api = await import("../../api/meta-webhook.js");
    const previous = { ...process.env };
    process.env.META_WEBHOOK_VERIFY_TOKEN = VERIFY;
    try {
      const response = await api.GET(new Request(`https://x/api/meta-webhook?hub.mode=subscribe&hub.verify_token=${VERIFY}&hub.challenge=ok`));
      expect(await response.text()).toBe("ok");
      delete process.env.META_APP_SECRET;
      expect((await api.POST(post("{}"))).status).toBe(503);
    } finally {
      process.env = previous;
    }
  });
});
