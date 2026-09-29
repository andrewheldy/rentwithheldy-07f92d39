-- Turo status is now "Power Host" (was "All-Star Host").
ALTER TABLE public.vehicles ALTER COLUMN host_type SET DEFAULT 'Power Host';
UPDATE public.vehicles SET host_type = 'Power Host' WHERE host_type = 'All-Star Host';

-- Posts by the business itself show no byline, so it needs no author profile.
-- Deleting it unlinks those posts (ON DELETE SET NULL); their author text stays
-- "Rent With Heldy" for metadata and structured data.
DELETE FROM public.blog_authors WHERE slug = 'rent-with-heldy';
