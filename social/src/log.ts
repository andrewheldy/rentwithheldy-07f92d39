// Logging with secret redaction. Every log line and every stored error goes
// through redact() so a token can never reach Actions logs or Supabase, even
// when an API echoes it back in an error message or a URL.

let knownSecrets: string[] = [];

export function registerSecrets(values: string[]) {
  knownSecrets = [...new Set([...knownSecrets, ...values.filter((value) => value.length >= 8)])]
    // Longest first so a secret that contains another is fully replaced.
    .sort((a, b) => b.length - a.length);
}

const TOKEN_PARAM = /([?&](?:access_token|refresh_token|client_secret|input_token|key)=)[^&\s"']+/gi;
const BEARER = /(Bearer\s+)[A-Za-z0-9._~+/=-]+/g;
const JSON_TOKEN = /("(?:access_token|refresh_token|client_secret|id_token)"\s*:\s*")[^"]*"/gi;

export function redact(text: string): string {
  let output = text;
  for (const secret of knownSecrets) output = output.split(secret).join("[redacted]");
  return output
    .replace(TOKEN_PARAM, "$1[redacted]")
    .replace(BEARER, "$1[redacted]")
    .replace(JSON_TOKEN, '$1[redacted]"');
}

/** Deep-copies a value with token-like keys removed, for logging payloads. */
export function redactValue<T>(value: T): T {
  const SECRET_KEY = /^(access_token|refresh_token|client_secret|client_key|token|authorization)$/i;
  const walk = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(walk);
    if (input && typeof input === "object") {
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>).map(([key, inner]) => [
          key,
          SECRET_KEY.test(key) ? "[redacted]" : walk(inner),
        ]),
      );
    }
    return typeof input === "string" ? redact(input) : input;
  };
  return walk(value) as T;
}

export function errorMessage(error: unknown, max = 500): string {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : JSON.stringify(error);
  const message = redact(raw ?? "unknown error");
  return message.length > max ? `${message.slice(0, max)}…` : message;
}

export const log = {
  info: (message: string) => console.log(redact(message)),
  warn: (message: string) => console.warn(`::warning::${redact(message)}`),
  error: (message: string) => console.error(`::error::${redact(message)}`),
};
