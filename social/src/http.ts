// Small fetch wrapper shared by every platform module: JSON in/out, a
// timeout, and errors that carry the API's message without its tokens.

import { redact } from "./log.js";

export type FetchLike = typeof fetch;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(redact(message));
    this.name = "ApiError";
  }
}

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  /** Serialized as JSON unless it is already a string/URLSearchParams/Buffer. */
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
}

export function withQuery(url: string, query: RequestOptions["query"]) {
  if (!query) return url;
  const target = new URL(url);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) target.searchParams.set(key, String(value));
  }
  return target.toString();
}

function describeApiError(status: number, body: unknown): string {
  if (body && typeof body === "object") {
    const record = body as { error?: { code?: unknown; status?: unknown; message?: string; error_subcode?: unknown }; error_description?: unknown };
    // Meta: { error: { message, code, error_subcode } }
    // TikTok: { error: { code, message, log_id } }
    // Google: { error: { code, message, status } }
    const inner = record.error;
    if (inner && typeof inner === "object") {
      const code = inner.code ?? inner.status ?? "";
      const sub = inner.error_subcode ? `/${inner.error_subcode}` : "";
      if (inner.message || code) return `HTTP ${status} ${code}${sub}: ${inner.message ?? ""}`.trim();
    }
    if (typeof record.error_description === "string") return `HTTP ${status}: ${record.error_description}`;
  }
  const text = typeof body === "string" ? body.slice(0, 300) : "";
  return `HTTP ${status}${text ? `: ${text}` : ""}`;
}

// API responses are loosely shaped JSON that each caller reads field by field.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requestJson<T = any>(
  fetchImpl: FetchLike,
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", headers = {}, body, query, timeoutMs = 30_000 } = options;
  let payload: BodyInit | undefined;
  const finalHeaders: Record<string, string> = { ...headers };
  if (body !== undefined) {
    if (typeof body === "string" || body instanceof URLSearchParams || body instanceof Uint8Array) {
      payload = body as BodyInit;
    } else {
      payload = JSON.stringify(body);
      finalHeaders["Content-Type"] ??= "application/json; charset=UTF-8";
    }
  }

  const response = await fetchImpl(withQuery(url, query), {
    method,
    headers: finalHeaders,
    body: payload,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    // Non-JSON bodies are kept as text for the error message.
  }
  if (!response.ok) throw new ApiError(describeApiError(response.status, parsed), response.status, parsed);
  return parsed as T;
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
