-- Blog upgrades: article header options and author profiles.
--
-- Header: how the featured image appears at the top of an article
-- ('stacked' = title then image, the existing look; 'overlay' = full-width
-- image with the title over it; 'text' = no image in the header, which is
-- still used for cards and social previews), plus a caption, a photo credit
-- and a focal point that keeps the subject in frame when the image is cropped.
--
-- Authors: public profiles (name, role, short bio, photo) shown in an author
-- card under each article. blog_posts.author stays the display name used by
-- metadata and JSON-LD; author_id links the profile.

ALTER TABLE public.blog_posts
  ADD COLUMN header_layout text NOT NULL DEFAULT 'stacked'
    CHECK (header_layout IN ('stacked', 'overlay', 'text')),
  ADD COLUMN featured_image_caption text
    CHECK (featured_image_caption IS NULL OR char_length(featured_image_caption) <= 300),
  ADD COLUMN featured_image_credit text
    CHECK (featured_image_credit IS NULL OR char_length(featured_image_credit) <= 120),
  ADD COLUMN featured_image_focus_x smallint NOT NULL DEFAULT 50
    CHECK (featured_image_focus_x BETWEEN 0 AND 100),
  ADD COLUMN featured_image_focus_y smallint NOT NULL DEFAULT 50
    CHECK (featured_image_focus_y BETWEEN 0 AND 100);

CREATE TABLE public.blog_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 80),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  role text CHECK (role IS NULL OR char_length(role) <= 120),
  bio text CHECK (bio IS NULL OR char_length(bio) <= 600),
  photo_url text CHECK (photo_url IS NULL OR photo_url ~ '^(/|https://)'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER blog_authors_updated_at
  BEFORE UPDATE ON public.blog_authors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.blog_posts
  ADD COLUMN author_id uuid REFERENCES public.blog_authors(id) ON DELETE SET NULL;

CREATE INDEX idx_blog_posts_author ON public.blog_posts (author_id);

REVOKE ALL ON public.blog_authors FROM anon;
GRANT SELECT ON public.blog_authors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_authors TO authenticated;
GRANT ALL ON public.blog_authors TO service_role;

ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;

-- Author profiles are public, like categories and tags.
CREATE POLICY "Anyone can view blog authors"
  ON public.blog_authors FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Admins manage blog authors"
  ON public.blog_authors FOR ALL TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

-- Every existing post is by the business itself.
INSERT INTO public.blog_authors (slug, name) VALUES ('rent-with-heldy', 'Rent With Heldy')
  ON CONFLICT (slug) DO NOTHING;
UPDATE public.blog_posts
  SET author_id = (SELECT id FROM public.blog_authors WHERE slug = 'rent-with-heldy')
  WHERE author = 'Rent With Heldy' AND author_id IS NULL;
