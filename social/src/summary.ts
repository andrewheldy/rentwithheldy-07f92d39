// GitHub Actions job summary (markdown) plus a plain-log fallback locally.

import { appendFileSync } from "node:fs";
import { redact } from "./log.js";

const cell = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, " ");

export function markdownTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return "_None._\n";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(cell).join(" | ")} |`),
  ].join("\n") + "\n";
}

export function writeSummary(markdown: string, env: Record<string, string | undefined> = process.env) {
  const safe = redact(markdown);
  const target = env.GITHUB_STEP_SUMMARY;
  if (target) appendFileSync(target, `${safe}\n`);
  else console.log(`\n${safe}`);
}
