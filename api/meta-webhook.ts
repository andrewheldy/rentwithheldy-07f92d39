import { handleWebhookGet, handleWebhookPost, storeFromEnv } from "../social/src/webhook.js";

// Meta webhooks for Instagram and the Facebook Page. Uses the Web-standard
// handler signature so the exact raw body is available for the
// X-Hub-Signature-256 check (the legacy req/res helpers parse it first).
// Events are stored in social_events for review; nothing is auto-replied.

const deps = () => ({ env: process.env, store: storeFromEnv(process.env), log: console });

export async function GET(request: Request) {
  return handleWebhookGet(request, deps());
}

export async function POST(request: Request) {
  return handleWebhookPost(request, deps());
}
