// Meta webhooks (Instagram + Facebook Page) -> social_events.
// GET is the subscription handshake; POST carries events signed with
// X-Hub-Signature-256: sha256=<hex HMAC-SHA256 of the raw body, keyed with
// the app secret>. Nothing here replies to anyone: events are stored for
// review and replies go out only with the owner's approval.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Env } from "./config.js";
import { errorMessage, redactValue } from "./log.js";
import { SupabaseStore, type SocialEventRow, type Store } from "./store.js";

export const MAX_BODY_BYTES = 1024 * 1024;

const INQUIRY = /\b(rent|rental|renting|price|prices|pricing|rate|rates|cost|how much|available|availability|book|booking|reserve|reservation|airport|fll|mia|pbi|cruise|port everglades|hotel|deliver|delivery|pick ?up|drop ?off|quote|weekly|monthly)\b/i;

export function tagEvent(text: string | null | undefined): string[] {
  return text && INQUIRY.test(text) ? ["inquiry"] : [];
}

export function verifySignature(rawBody: Uint8Array, header: string | null, appSecret: string): boolean {
  if (!header || !header.startsWith("sha256=")) return false;
  const received = Buffer.from(header.slice("sha256=".length), "hex");
  const expected = createHmac("sha256", appSecret).update(rawBody).digest();
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function handshake(url: URL, verifyToken: string | null): { status: number; body: string } {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (!verifyToken || mode !== "subscribe" || !token || !challenge) return { status: 403, body: "Forbidden" };
  const a = Buffer.from(token);
  const b = Buffer.from(verifyToken);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { status: 403, body: "Forbidden" };
  return { status: 200, body: challenge };
}

const toIso = (time: unknown): string | null => {
  const value = typeof time === "string" && /^\d+$/.test(time) ? Number(time) : time;
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value > 1e12 ? value : value * 1000).toISOString();
  }
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString();
  return null;
};

// Meta payloads vary by field and version; every read below is guarded.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;

function messagingEvents(platform: "instagram" | "facebook", entry: Json): SocialEventRow[] {
  const rows: SocialEventRow[] = [];
  for (const item of (entry.messaging ?? []) as Json[]) {
    const message = item.message;
    // Echoes are our own outgoing messages.
    if (!message?.mid || message.is_echo) continue;
    rows.push({
      platform,
      event_type: "message",
      external_id: `message:${message.mid}`,
      author: item.sender?.id ? String(item.sender.id) : null,
      body: typeof message.text === "string" ? message.text : null,
      tags: tagEvent(message.text),
      occurred_at: toIso(item.timestamp),
      raw: redactValue(item),
    });
  }
  return rows;
}

export function parseMetaEvents(payload: unknown): SocialEventRow[] {
  if (!payload || typeof payload !== "object") return [];
  const { object, entry } = payload as Json;
  if (!Array.isArray(entry)) return [];
  const rows: SocialEventRow[] = [];

  for (const item of entry as Json[]) {
    if (object === "instagram") {
      for (const change of (item.changes ?? []) as Json[]) {
        const value = change.value ?? {};
        if (change.field === "comments" && value.id) {
          rows.push({
            platform: "instagram",
            event_type: "comment",
            external_id: `comment:${value.id}`,
            author: value.from?.username ?? value.from?.id ?? null,
            body: value.text ?? null,
            tags: tagEvent(value.text),
            occurred_at: toIso(item.time),
            raw: redactValue(change),
          });
        } else if (change.field === "mentions" && (value.comment_id || value.media_id)) {
          rows.push({
            platform: "instagram",
            event_type: "mention",
            external_id: value.comment_id ? `mention:comment:${value.comment_id}` : `mention:media:${value.media_id}`,
            author: null,
            body: null,
            tags: [],
            occurred_at: toIso(item.time),
            raw: redactValue(change),
          });
        }
      }
      rows.push(...messagingEvents("instagram", item));
    } else if (object === "page") {
      for (const change of (item.changes ?? []) as Json[]) {
        const value = change.value ?? {};
        if (change.field !== "feed" || value.verb !== "add") continue;
        // Skip the Page's own posts and replies.
        if (value.from?.id && String(value.from.id) === String(item.id)) continue;
        const isComment = value.item === "comment" && value.comment_id;
        const externalId = isComment ? `comment:${value.comment_id}` : value.post_id ? `post:${value.post_id}` : null;
        if (!externalId) continue;
        rows.push({
          platform: "facebook",
          event_type: isComment ? "comment" : "post",
          external_id: externalId,
          author: value.from?.name ?? value.from?.id ?? null,
          body: value.message ?? null,
          tags: tagEvent(value.message),
          occurred_at: toIso(value.created_time ?? item.time),
          raw: redactValue(change),
        });
      }
      rows.push(...messagingEvents("facebook", item));
    }
  }
  // One delivery can repeat an event; keep the first.
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.platform}:${row.external_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export interface WebhookDeps {
  env: Env;
  /** null when Supabase is not configured. */
  store: Store | null;
  log: { info(message: string): void; error(message: string): void };
}

export function storeFromEnv(env: Env): Store | null {
  const url = env.SUPABASE_URL?.trim();
  const key = (env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  return url && key ? new SupabaseStore({ url, serviceKey: key }) : null;
}

const text = (status: number, body: string) =>
  new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

export async function handleWebhookGet(request: Request, deps: WebhookDeps): Promise<Response> {
  const result = handshake(new URL(request.url), deps.env.META_WEBHOOK_VERIFY_TOKEN?.trim() || null);
  return text(result.status, result.body);
}

export async function handleWebhookPost(request: Request, deps: WebhookDeps): Promise<Response> {
  const appSecret = deps.env.META_APP_SECRET?.trim();
  if (!appSecret) {
    deps.log.info("meta-webhook: skipped: not configured (META_APP_SECRET is not set)");
    return text(503, "Not configured");
  }
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return text(413, "Payload too large");

  const raw = new Uint8Array(await request.arrayBuffer());
  if (raw.byteLength > MAX_BODY_BYTES) return text(413, "Payload too large");
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"), appSecret)) {
    return text(401, "Invalid signature");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(raw).toString("utf8"));
  } catch {
    return text(400, "Invalid JSON");
  }

  const events = parseMetaEvents(payload);
  if (events.length === 0) return text(200, "OK");
  if (!deps.store) {
    deps.log.info(`meta-webhook: skipped storing ${events.length} event(s): Supabase is not configured`);
    return text(200, "OK");
  }
  try {
    const inserted = await deps.store.insertEvents(events);
    deps.log.info(`meta-webhook: stored ${inserted} new of ${events.length} event(s)`);
  } catch (error) {
    // Still 200: a paused database must not get the app unsubscribed by
    // repeated delivery failures. Events remain in Meta's inbox.
    deps.log.error(
      `meta-webhook: could not store ${events.length} event(s) (${events.map((event) => event.external_id).join(", ")}): ${errorMessage(error)}`,
    );
  }
  return text(200, "OK");
}
