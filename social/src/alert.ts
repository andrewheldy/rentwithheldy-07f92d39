// Optional failure email to the owner via Resend's REST API.

import type { AlertConfig } from "./config.js";
import { requestJson, type FetchLike } from "./http.js";
import { redact } from "./log.js";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function sendFailureAlert(
  config: AlertConfig | null,
  fetchImpl: FetchLike,
  subject: string,
  lines: string[],
  runUrl: string | null,
): Promise<"sent" | "not_configured" | "failed"> {
  if (!config || lines.length === 0) return "not_configured";
  const html = [
    `<p>${escapeHtml(subject)}</p>`,
    `<ul>${lines.map((line) => `<li>${escapeHtml(redact(line))}</li>`).join("")}</ul>`,
    runUrl ? `<p><a href="${escapeHtml(runUrl)}">Open the GitHub Actions run</a></p>` : "",
  ].join("");
  try {
    await requestJson(fetchImpl, "https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${config.resendApiKey}` },
      body: { from: config.from, to: [config.to], subject, html },
    });
    return "sent";
  } catch {
    return "failed";
  }
}
