-- Blog CMS: posts, categories, tags, sources, slug redirects, and the
-- blog-images storage bucket.
--
-- Visibility rule (used by every public policy below): a post is LIVE when
--   status IN ('published', 'scheduled') AND published_at <= now().
-- Scheduled posts therefore go live on their own at published_at without a
-- cron job, and never before. Drafts are never public. Admins (has_role
-- 'admin') can read and write everything; the public can only read live posts
-- and the rows that hang off them.

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 80),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.blog_categories.slug IS 'Stable identifier used in /blog?category= and for localized display labels. Do not rename.';

INSERT INTO public.blog_categories (slug, name, sort_order) VALUES
  ('car-rental-guides', 'Car Rental Guides', 10),
  ('airport-cruise-travel', 'Airport & Cruise Travel', 20),
  ('south-florida-travel', 'South Florida Travel', 30),
  ('industry-news', 'Industry News', 40),
  ('p2p-car-sharing', 'P2P Car Sharing', 50),
  ('rental-comparisons', 'Rental Comparisons', 60)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 120),
  excerpt text NOT NULL DEFAULT '' CHECK (char_length(excerpt) <= 600),
  -- Rich text as a ProseMirror/Tiptap JSON document. Rendered by a fixed
  -- allow-list renderer, never injected as HTML.
  content jsonb NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb
    CHECK (jsonb_typeof(content) = 'object'),
  featured_image text,
  featured_image_alt text,
  featured_image_width integer CHECK (featured_image_width IS NULL OR featured_image_width > 0),
  featured_image_height integer CHECK (featured_image_height IS NULL OR featured_image_height > 0),
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author text NOT NULL DEFAULT 'Rent With Heldy' CHECK (char_length(author) BETWEEN 1 AND 120),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  published_at timestamptz,
  -- Editorial "last updated" date shown to readers and used for
  -- dateModified / sitemap lastmod. Distinct from updated_at, which changes on
  -- every write (including unpublishing).
  last_updated_at timestamptz,
  seo_title text CHECK (seo_title IS NULL OR char_length(seo_title) <= 200),
  meta_description text CHECK (meta_description IS NULL OR char_length(meta_description) <= 500),
  primary_keyword text CHECK (primary_keyword IS NULL OR char_length(primary_keyword) <= 120),
  canonical_url text CHECK (canonical_url IS NULL OR canonical_url ~ '^https://'),
  social_title text CHECK (social_title IS NULL OR char_length(social_title) <= 200),
  social_description text CHECK (social_description IS NULL OR char_length(social_description) <= 500),
  cta_label text CHECK (cta_label IS NULL OR char_length(cta_label) BETWEEN 1 AND 80),
  cta_url text CHECK (cta_url IS NULL OR cta_url ~ '^(/|https://)'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_publish_date_required CHECK (status = 'draft' OR published_at IS NOT NULL),
  CONSTRAINT blog_posts_cta_pair CHECK ((cta_label IS NULL) = (cta_url IS NULL))
);

COMMENT ON TABLE public.blog_posts IS 'Public only when status IN (published, scheduled) AND published_at <= now().';

CREATE INDEX blog_posts_live_idx ON public.blog_posts (status, published_at DESC);
CREATE INDEX blog_posts_category_idx ON public.blog_posts (category_id, published_at DESC);
CREATE INDEX blog_posts_updated_idx ON public.blog_posts (updated_at DESC);

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Tags
-- ---------------------------------------------------------------------------
CREATE TABLE public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 80),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_post_tags (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX blog_post_tags_tag_idx ON public.blog_post_tags (tag_id);

-- ---------------------------------------------------------------------------
-- Sources (cited references rendered in the article's "Sources" section)
-- ---------------------------------------------------------------------------
CREATE TABLE public.blog_post_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  url text NOT NULL CHECK (url ~ '^https?://' AND char_length(url) <= 2000),
  publisher text CHECK (publisher IS NULL OR char_length(publisher) <= 120),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blog_post_sources_post_idx ON public.blog_post_sources (post_id, position);

-- ---------------------------------------------------------------------------
-- Slug redirects: when a live post's slug changes, the old URL keeps working
-- as a permanent redirect to the post's current slug.
-- ---------------------------------------------------------------------------
CREATE TABLE public.blog_slug_redirects (
  old_slug text PRIMARY KEY CHECK (old_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blog_slug_redirects_post_idx ON public.blog_slug_redirects (post_id);

CREATE OR REPLACE FUNCTION public.blog_posts_track_slug_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- A slug that is now in use by a real post must never redirect elsewhere.
  DELETE FROM public.blog_slug_redirects WHERE old_slug = NEW.slug;

  IF TG_OP = 'UPDATE'
     AND NEW.slug IS DISTINCT FROM OLD.slug
     AND OLD.status IN ('published', 'scheduled')
     AND OLD.published_at IS NOT NULL
     AND OLD.published_at <= now()
  THEN
    INSERT INTO public.blog_slug_redirects (old_slug, post_id)
    VALUES (OLD.slug, NEW.id)
    ON CONFLICT (old_slug) DO UPDATE SET post_id = EXCLUDED.post_id, created_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER blog_posts_slug_redirects
  AFTER INSERT OR UPDATE OF slug ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.blog_posts_track_slug_change();

REVOKE EXECUTE ON FUNCTION public.blog_posts_track_slug_change() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.blog_categories, public.blog_posts, public.blog_tags,
  public.blog_post_tags, public.blog_post_sources, public.blog_slug_redirects FROM anon;
GRANT SELECT ON public.blog_categories, public.blog_posts, public.blog_tags,
  public.blog_post_tags, public.blog_post_sources, public.blog_slug_redirects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_categories, public.blog_posts,
  public.blog_tags, public.blog_post_tags, public.blog_post_sources,
  public.blog_slug_redirects TO authenticated;
GRANT ALL ON public.blog_categories, public.blog_posts, public.blog_tags,
  public.blog_post_tags, public.blog_post_sources, public.blog_slug_redirects TO service_role;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_slug_redirects ENABLE ROW LEVEL SECURITY;

-- Categories and tags are public vocabulary.
CREATE POLICY "Anyone can view blog categories"
  ON public.blog_categories FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Admins manage blog categories"
  ON public.blog_categories FOR ALL TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Anyone can view blog tags"
  ON public.blog_tags FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Admins manage blog tags"
  ON public.blog_tags FOR ALL TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

-- Posts: public reads live posts only.
CREATE POLICY "Public can view live blog posts"
  ON public.blog_posts FOR SELECT TO anon, authenticated
  USING (status IN ('published', 'scheduled') AND published_at IS NOT NULL AND published_at <= now());
CREATE POLICY "Admins can view all blog posts"
  ON public.blog_posts FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can insert blog posts"
  ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can update blog posts"
  ON public.blog_posts FOR UPDATE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can delete blog posts"
  ON public.blog_posts FOR DELETE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- Child rows are visible exactly when the parent post is visible to the
-- caller (the EXISTS runs under the caller's blog_posts policies).
CREATE POLICY "View tags of visible posts"
  ON public.blog_post_tags FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.blog_posts p WHERE p.id = post_id));
CREATE POLICY "Admins manage post tags"
  ON public.blog_post_tags FOR ALL TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "View sources of visible posts"
  ON public.blog_post_sources FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.blog_posts p WHERE p.id = post_id));
CREATE POLICY "Admins manage post sources"
  ON public.blog_post_sources FOR ALL TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "View redirects to visible posts"
  ON public.blog_slug_redirects FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.blog_posts p WHERE p.id = post_id));
CREATE POLICY "Admins manage slug redirects"
  ON public.blog_slug_redirects FOR ALL TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

-- ---------------------------------------------------------------------------
-- Storage: public-read bucket for featured and inline article images.
-- Files are served by public URL; no listing policy is granted to visitors,
-- so unpublished drafts' images cannot be enumerated.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images', 'blog-images', true, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Admins can view blog images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'blog-images' AND public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can upload blog images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images' AND public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can update blog images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'blog-images' AND public.has_role((select auth.uid()), 'admin'));
CREATE POLICY "Admins can delete blog images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images' AND public.has_role((select auth.uid()), 'admin'));
