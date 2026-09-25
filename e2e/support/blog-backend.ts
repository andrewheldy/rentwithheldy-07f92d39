import type { Page, Route } from "@playwright/test";

/*
 * In-memory stand-in for the Supabase REST + Storage endpoints the blog uses.
 * It mimics the pieces that matter for behavior:
 *   • RLS: requests without the admin token only ever see LIVE posts
 *     (published/scheduled with published_at <= now) and their child rows.
 *   • PostgREST filters used by the app (eq, neq, in, lte, order, limit).
 *   • Embedded selects: category, post_tags(tag), sources.
 *   • The slug-change redirect trigger and the unique-slug constraint.
 */

export const SUPABASE = "https://example.supabase.co";
const ADMIN_TOKEN = "playwright-admin-token";

export const adminUser = {
  id: "11111111-1111-4111-8111-111111111111",
  aud: "authenticated",
  role: "authenticated",
  email: "admin@rentwithheldy.com",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00.000Z",
};

type Row = Record<string, unknown>;

export const CATEGORIES = [
  { id: "cat-guides", slug: "car-rental-guides", name: "Car Rental Guides", sort_order: 10 },
  { id: "cat-airport", slug: "airport-cruise-travel", name: "Airport & Cruise Travel", sort_order: 20 },
  { id: "cat-sofla", slug: "south-florida-travel", name: "South Florida Travel", sort_order: 30 },
  { id: "cat-news", slug: "industry-news", name: "Industry News", sort_order: 40 },
  { id: "cat-p2p", slug: "p2p-car-sharing", name: "P2P Car Sharing", sort_order: 50 },
  { id: "cat-compare", slug: "rental-comparisons", name: "Rental Comparisons", sort_order: 60 },
];

// 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

export function paragraph(text: string) {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

export function makePost(overrides: Row = {}): Row {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "Untitled",
    slug: "untitled",
    excerpt: "",
    content: { type: "doc", content: [paragraph("Body text.")] },
    featured_image: null,
    featured_image_alt: null,
    featured_image_width: null,
    featured_image_height: null,
    category_id: null,
    author: "Rent With Heldy",
    status: "draft",
    published_at: null,
    last_updated_at: null,
    seo_title: null,
    meta_description: null,
    primary_keyword: null,
    canonical_url: null,
    social_title: null,
    social_description: null,
    cta_label: null,
    cta_url: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export class BlogBackend {
  posts: Row[] = [];
  tags: Row[] = [];
  postTags: Row[] = [];
  sources: Row[] = [];
  redirects: Row[] = [];
  uploads: string[] = [];

  isLive(post: Row) {
    return (
      (post.status === "published" || post.status === "scheduled") &&
      typeof post.published_at === "string" &&
      new Date(post.published_at) <= new Date()
    );
  }

  private visiblePosts(admin: boolean) {
    return admin ? this.posts : this.posts.filter((p) => this.isLive(p));
  }

  private embed(post: Row, select: string): Row {
    const out: Row = { ...post };
    if (select.includes("category:blog_categories")) {
      const c = CATEGORIES.find((cat) => cat.id === post.category_id);
      out.category = c ? { id: c.id, slug: c.slug, name: c.name } : null;
    }
    if (select.includes("post_tags:blog_post_tags")) {
      out.post_tags = this.postTags
        .filter((pt) => pt.post_id === post.id)
        .map((pt) => ({ tag: this.tags.find((t) => t.id === pt.tag_id) ?? null }));
    }
    if (select.includes("sources:blog_post_sources")) {
      out.sources = this.sources.filter((s) => s.post_id === post.id);
    }
    return out;
  }

  private applyFilters(rows: Row[], params: URLSearchParams): Row[] {
    let result = rows;
    for (const [key, raw] of params) {
      if (["select", "order", "limit", "offset", "columns", "on_conflict"].includes(key)) continue;
      const dot = raw.indexOf(".");
      const op = raw.slice(0, dot);
      const value = raw.slice(dot + 1);
      result = result.filter((row) => {
        const field = row[key];
        switch (op) {
          case "eq":
            return String(field) === value;
          case "neq":
            return String(field) !== value;
          case "in":
            return value.replace(/^\(|\)$/g, "").split(",").map((v) => v.replace(/^"|"$/g, "")).includes(String(field));
          case "lte":
            return field != null && new Date(String(field)) <= new Date(value);
          default:
            return true;
        }
      });
    }
    const order = params.get("order");
    if (order) {
      const [col, dir] = order.split(".");
      result = [...result].sort((a, b) => {
        const cmp = String(a[col] ?? "").localeCompare(String(b[col] ?? ""), undefined, { numeric: true });
        return dir === "desc" ? -cmp : cmp;
      });
    }
    const limit = params.get("limit");
    return limit ? result.slice(0, Number(limit)) : result;
  }

  async handle(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const admin = (request.headers()["authorization"] ?? "").includes(ADMIN_TOKEN);
    const wantsObject = (request.headers()["accept"] ?? "").includes("vnd.pgrst.object");
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", headers: { "content-range": "0-0/*" }, body: JSON.stringify(body) });
    const body = () => {
      const data = request.postData();
      return data ? JSON.parse(data) : null;
    };
    const forbidden = () => json({ code: "42501", message: "permission denied" }, 403);

    if (path === "/auth/v1/user") return admin ? json(adminUser) : json({ message: "no session" }, 401);
    if (path === "/rest/v1/user_roles") return json(admin ? [{ role: "admin" }] : []);

    // ---- Storage -----------------------------------------------------------
    if (path.startsWith("/storage/v1/object/public/blog-images/")) {
      return route.fulfill({ status: 200, contentType: "image/png", body: PNG });
    }
    if (path.startsWith("/storage/v1/object/blog-images/") && method === "POST") {
      if (!admin) return forbidden();
      const key = path.replace("/storage/v1/object/", "");
      this.uploads.push(key);
      return json({ Key: key, Id: crypto.randomUUID() });
    }

    const table = path.replace("/rest/v1/", "");
    const params = url.searchParams;
    const select = params.get("select") ?? "*";

    if (table === "blog_categories") return json(this.applyFilters(CATEGORIES, params));

    if (table === "blog_tags") {
      if (method === "GET") return json(this.applyFilters(this.tags, params));
      if (method === "POST") {
        if (!admin) return forbidden();
        const created = (body() as Row[]).map((t) => ({ id: crypto.randomUUID(), ...t }));
        this.tags.push(...created);
        return json(created, 201);
      }
    }

    if (table === "blog_posts") {
      if (method === "GET") {
        const rows = this.applyFilters(this.visiblePosts(admin), params).map((p) => this.embed(p, select));
        return json(rows);
      }
      if (!admin) return forbidden();
      if (method === "POST") {
        const input = body() as Row;
        if (this.posts.some((p) => p.slug === input.slug)) {
          return json({ code: "23505", message: 'duplicate key value violates unique constraint "blog_posts_slug_key"' }, 409);
        }
        const post = makePost(input);
        this.posts.push(post);
        return json(wantsObject ? { id: post.id } : [{ id: post.id }], 201);
      }
      if (method === "PATCH") {
        const patch = body() as Row;
        const targets = this.applyFilters(this.posts, params);
        for (const post of targets) {
          if (patch.slug && patch.slug !== post.slug) {
            if (this.posts.some((p) => p !== post && p.slug === patch.slug)) {
              return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
            }
            if (this.isLive(post)) {
              this.redirects = this.redirects.filter((r) => r.old_slug !== post.slug);
              this.redirects.push({ old_slug: post.slug, post_id: post.id });
            }
            this.redirects = this.redirects.filter((r) => r.old_slug !== patch.slug);
          }
          Object.assign(post, patch, { updated_at: new Date().toISOString() });
        }
        return route.fulfill({ status: 204 });
      }
      if (method === "DELETE") {
        const ids = new Set(this.applyFilters(this.posts, params).map((p) => p.id));
        this.posts = this.posts.filter((p) => !ids.has(p.id));
        this.postTags = this.postTags.filter((pt) => !ids.has(pt.post_id));
        this.sources = this.sources.filter((s) => !ids.has(s.post_id));
        this.redirects = this.redirects.filter((r) => !ids.has(r.post_id));
        return route.fulfill({ status: 204 });
      }
    }

    if (table === "blog_post_tags" || table === "blog_post_sources") {
      const key = table === "blog_post_tags" ? "postTags" : "sources";
      if (method === "GET") {
        const visible = new Set(this.visiblePosts(admin).map((p) => p.id));
        return json(this.applyFilters(this[key].filter((r) => visible.has(r.post_id)), params));
      }
      if (!admin) return forbidden();
      if (method === "DELETE") {
        const doomed = new Set(this.applyFilters(this[key], params));
        this[key] = this[key].filter((r) => !doomed.has(r));
        return route.fulfill({ status: 204 });
      }
      if (method === "POST") {
        const rows = (body() as Row[]).map((r) => ({ id: crypto.randomUUID(), ...r }));
        this[key].push(...rows);
        return json(rows, 201);
      }
    }

    if (table === "blog_slug_redirects" && method === "GET") {
      const visible = this.visiblePosts(admin);
      const rows = this.applyFilters(this.redirects, params)
        .map((r) => ({ ...r, post: visible.find((p) => p.id === r.post_id) ?? null }))
        .filter((r) => r.post)
        .map((r) => ({ post: { slug: r.post!.slug, status: r.post!.status, published_at: r.post!.published_at } }));
      return json(rows);
    }

    return json({}, 404);
  }

  async install(page: Page, { asAdmin }: { asAdmin: boolean }) {
    if (asAdmin) {
      await page.addInitScript(({ user, token }) => {
        const expiresAt = Math.floor(Date.now() / 1000) + 3_600;
        localStorage.setItem(
          "sb-example-auth-token",
          JSON.stringify({ access_token: token, refresh_token: "refresh", token_type: "bearer", expires_in: 3_600, expires_at: expiresAt, user }),
        );
      }, { user: adminUser, token: ADMIN_TOKEN });
    }
    await page.route(`${SUPABASE}/**`, (route) => this.handle(route));
  }
}
