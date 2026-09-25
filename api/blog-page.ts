import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isValidSlug } from "../src/lib/blog/slug.js";
import { postPath } from "../src/lib/blog/seo.js";
import {
  articleHeadTags,
  indexHeadTags,
  injectHead,
  notFoundHeadTags,
} from "../src/server/blog/html.js";
import { createPublicSupabase, loadLivePost, loadLiveSummaries } from "../src/server/blog/data.js";

// Serves /blog and /blog/:slug (see the rewrites in vercel.json): the normal
// SPA shell with blog-specific <head> tags, a real 404 status for unknown or
// unpublished posts, and a 301 for old slugs of live posts. The React app
// then boots exactly as on every other route.

let cachedShell: string | null = null;

async function loadShell(req: VercelRequest): Promise<string> {
  if (cachedShell) return cachedShell;
  try {
    // Bundled with the function via `includeFiles` in vercel.json.
    cachedShell = await readFile(join(process.cwd(), "dist", "index.html"), "utf8");
    return cachedShell;
  } catch {
    // Fallback: fetch the deployed static shell from this same deployment.
    const host = req.headers["x-forwarded-host"] ?? req.headers.host;
    const response = await fetch(`https://${host}/index.html`);
    if (!response.ok) throw new Error(`Could not load the app shell (${response.status}).`);
    cachedShell = await response.text();
    return cachedShell;
  }
}

function send(res: VercelResponse, status: number, html: string, cache: string) {
  res.status(status);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", cache);
  if (status === 404) res.setHeader("X-Robots-Tag", "noindex");
  res.send(html);
}

// Short CDN cache so publishing/unpublishing shows up within a minute.
const LIVE_CACHE = "public, max-age=0, s-maxage=60, stale-while-revalidate=300";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }

  const shell = await loadShell(req);
  // vercel.json rewrites /blog → ?view=index and /blog/:slug → ?post=:slug.
  const isIndex = req.query.view === "index";
  const rawSlug = typeof req.query.post === "string" ? req.query.post : "";

  try {
    const supabase = createPublicSupabase();

    if (isIndex) {
      const posts = await loadLiveSummaries(supabase);
      return send(res, 200, injectHead(shell, indexHeadTags(posts)), LIVE_CACHE);
    }

    if (!isValidSlug(rawSlug)) {
      return send(res, 404, injectHead(shell, notFoundHeadTags()), LIVE_CACHE);
    }

    const result = await loadLivePost(supabase, rawSlug);
    if (result.kind === "redirect") {
      res.setHeader("Cache-Control", LIVE_CACHE);
      res.setHeader("Location", postPath(result.slug));
      return res.status(301).end();
    }
    if (result.kind === "not_found") {
      return send(res, 404, injectHead(shell, notFoundHeadTags()), LIVE_CACHE);
    }
    return send(res, 200, injectHead(shell, articleHeadTags(result.post)), LIVE_CACHE);
  } catch (error) {
    // Never take the page down over metadata: serve the plain SPA shell and
    // let the client render (and report) the problem.
    console.error("blog-page:", error instanceof Error ? error.message : error);
    return send(res, 200, shell, "no-store");
  }
}
