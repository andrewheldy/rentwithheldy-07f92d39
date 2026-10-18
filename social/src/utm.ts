// UTM link builder. utm_content carries the post id so a website visit or a
// booking inquiry can be traced back to the exact post that sent it.

export interface UtmOptions {
  source: string;
  campaign: string;
  content?: string;
  medium?: string;
}

export function buildLink(url: string, { source, campaign, content, medium = "social" }: UtmOptions): string {
  const target = new URL(url);
  target.searchParams.set("utm_source", source);
  target.searchParams.set("utm_medium", medium);
  target.searchParams.set("utm_campaign", campaign);
  if (content) target.searchParams.set("utm_content", content);
  else target.searchParams.delete("utm_content");
  return target.toString();
}
