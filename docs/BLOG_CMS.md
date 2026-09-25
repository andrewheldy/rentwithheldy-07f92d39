# Blog CMS

The blog lives at **/blog** (index) and **/blog/[slug]** (articles). It is managed
from the existing admin portal at **/admin/blog**. Visitors reach it from the
header via **About → Read the Blog**, and from the footer (Company → Blog).
Blog is intentionally not in the primary header.

## Writing a post (for editors)

1. Sign in at **/auth** with an admin account, then open **/admin/blog**
   (or any admin page → **Blog** tab).
2. Click **New Post**.
3. Fill in **Title**. The **Slug** (web address) is created from the title;
   edit it if you want a shorter address. After the first save it no longer
   changes automatically.
4. Write a one-to-two sentence **Excerpt** (shown on cards and under the headline).
5. Write the article in **Article content**. The toolbar has headings (H2/H3),
   bold, italic, links, bulleted and numbered lists, quotes, images, tables and
   a separator line. Undo: Ctrl/⌘+Z. Save: Ctrl/⌘+S.
   - **Links:** select text → link button. Pick one of “Our pages” (booking,
     airport, hotel, cruise, body shop, local rentals, how it works, contact…) or
     paste any https:// address. Links to other sites open in a new tab.
   - **Images:** use the image button (pasting/dropping images is blocked so every
     image is optimized and has alt text). Photos are resized automatically.
6. In the sidebar: pick a **Category**, add **Tags** (type + Enter), check the
   **Author**, and upload a **Featured image** with **alt text** (landscape,
   at least 1200 px wide works best — it is also the social share image).
7. Add **Sources** (name, URL, optional publisher) for any facts you cite.
8. Choose an optional **Call to action** preset (or Custom label + URL).
9. **SEO** (optional): SEO title, meta description, primary keyword, canonical
   URL, social title/description. Blank fields fall back to sensible defaults.
   Character counts are guidance only and never block publishing.
10. Check the **Publishing checklist**, click **Preview** to see the article
    exactly as readers will (unsaved changes included), then:
    - **Save draft** — private; only admins can see it.
    - **Publish now** — live immediately.
    - **Scheduled** status + a future **Publish date** → **Schedule** — goes
      live automatically at that time.
11. To change a live article, edit and click **Update**. “Last updated” is set
    automatically when the text changes (or set it yourself). If you change a
    live article's slug, the old address permanently redirects to the new one.
12. To take an article down, click **Unpublish** (editor sidebar or the “…”
    menu in the list). **Delete** asks for confirmation and cannot be undone.

## How it works (for developers)

| Piece | Where |
| --- | --- |
| Schema, RLS, storage bucket, slug-redirect trigger | `supabase/migrations/20260925081538_blog_cms.sql` |
| Data access (public + admin) | `src/lib/blog/api.ts` |
| Status / scheduling rule | `src/lib/blog/status.ts` (mirrors the RLS policy) |
| Metadata + JSON-LD (shared by app and server) | `src/lib/blog/seo.ts` |
| Safe JSON → React article renderer | `src/components/blog/ArticleContent.tsx` |
| Public pages | `src/pages/Blog.tsx`, `src/pages/BlogPost.tsx`, `src/components/blog/*` |
| Admin | `src/pages/AdminBlog*.tsx`, `src/components/admin/blog/*` |
| Server-rendered `<head>`, 404s and 301s for `/blog*` | `api/blog-page.ts`, `src/server/blog/*` |
| Live blog sitemap | `api/blog-sitemap.ts` → `/sitemap-blog.xml` (listed in `/sitemap.xml`) |
| UI copy (5 locales) | `src/i18n/locales/*/blog.json` |

- **Content format.** Article bodies are Tiptap/ProseMirror JSON (`blog_posts.content`).
  They are never stored or injected as HTML; the renderer only emits allow-listed
  elements and sanitizes every href/src.
- **Who can do what.** Row Level Security: anyone can read *live* posts
  (`status IN ('published','scheduled') AND published_at <= now()`); only users
  with the `admin` role in `user_roles` can create, edit, publish, unpublish or
  delete. The `blog-images` bucket is public-read, admin-write.
- **Scheduling.** No cron job is needed: a scheduled post becomes visible to the
  public, the article function and the sitemap as soon as `published_at` passes
  (CDN caches refresh within ~1–5 minutes). The row's `status` stays
  `scheduled`; the admin list shows it as Published.
- **SEO for a client-rendered site.** Vercel rewrites `/blog` and `/blog/:slug`
  to `api/blog-page.ts`, which serves the normal app shell with the article's
  title, description, canonical, Open Graph/Twitter tags and BlogPosting +
  BreadcrumbList JSON-LD already in `<head>` (so link previews work), returns
  a real 404 (+ `noindex`) for drafts/unknown slugs, and a 301 for old slugs.
  The React app then renders the same metadata via `react-helmet-async`.
- **Article language.** Articles are written in English. The page chrome is
  translated in all five locales; non-English readers see a short translated
  note, and the article body is marked `lang="en" dir="ltr"`.
- **Categories.** The six starting categories are seeded by the migration and
  have translated labels (`blog.json → categories.<slug>`). New categories can be
  added in the `blog_categories` table; they display their English name until a
  translation key is added.
