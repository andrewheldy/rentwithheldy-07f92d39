import type { VercelRequest, VercelResponse } from "@vercel/node";
import { blogSitemapXml } from "../src/server/blog/html.js";
import { createPublicSupabase, loadSitemapEntries } from "../src/server/blog/data.js";

// /sitemap-blog.xml (rewritten here in vercel.json; listed in the
// /sitemap.xml index). Live posts only — RLS on the publishable key makes
// drafts and not-yet-due scheduled posts unreadable, and the query filters
// them explicitly as well.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }
  try {
    const entries = await loadSitemapEntries(createPublicSupabase());
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=3600");
    return res.status(200).send(blogSitemapXml(entries));
  } catch (error) {
    console.error("blog-sitemap:", error instanceof Error ? error.message : error);
    // A 5xx tells crawlers to retry later instead of dropping every post.
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Sitemap temporarily unavailable");
  }
}
