# Blog post sources

Articles for `/blog`, written in Markdown so they can be reviewed in pull
requests before they go into the CMS (see `docs/BLOG_CMS.md`).

## Adding posts to the site

1. Edit or add a `.md` file here (front matter + body, see below).
2. Run `node scripts/blog-posts.mjs` to regenerate `import-drafts.sql`.
3. Run `npm test` and `npx playwright test e2e/blog-first-posts.spec.ts`.
4. Paste `import-drafts.sql` into the Supabase SQL editor of the production
   project and run it. Every post is created as a **draft**; a slug that
   already exists is skipped, so edits made in the admin are never
   overwritten.
5. In **/admin/blog**, open each draft, add a featured image with alt text,
   check the preview, then **Publish now** or **Schedule**.

After a post is in the CMS, the admin editor is the source of truth. Only use
this folder again for new posts.

`updates/` holds one-off SQL edits to posts that are already in the CMS (for
example, adding photos that live in `public/images/blog/`). Each one only
applies if the post hasn't been edited since, and it's run in the Supabase SQL
editor after the code it depends on is deployed.

## Format

```md
---
title: Article title
slug: article-address
excerpt: One or two sentences for cards and the headline.
category: south-florida-travel
tags: Tag one, Tag two
seo_title: Optional
meta_description: Optional
primary_keyword: Optional
cta: browse
sources:
  - Source name | https://example.com/page | Publisher
---

## Section heading

Paragraph with **bold**, *italic* and [a link](/book).

- Bullet
1. Numbered

| Table | Header |
| --- | --- |
| Cell | Cell |
```

`category` is a `blog_categories` slug. `cta` is one of `browse`, `plan`,
`airport`, `delivered`, `contact`, `guest` (the editor's presets).

Only `##`/`###` headings are allowed (the page owns the H1). Internal links
must be real routes; the tests check this.
