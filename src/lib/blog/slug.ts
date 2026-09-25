// URL slug helpers. The pattern matches the CHECK constraint on
// blog_posts.slug, blog_categories.slug and blog_tags.slug.

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const MAX_SLUG_LENGTH = 120;

export function slugify(input: string, maxLength = MAX_SLUG_LENGTH): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents: café → cafe
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "") // don't → dont, not don-t
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length <= maxLength) return slug;
  // Cut on a word boundary when possible.
  const cut = slug.slice(0, maxLength);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > maxLength / 2 ? cut.slice(0, lastDash) : cut).replace(/-+$/, "");
}

export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(slug);
}
