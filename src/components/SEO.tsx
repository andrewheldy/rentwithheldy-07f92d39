import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

interface SEOProps {
  title: string;
  description: string;
  path: string; // e.g. "/fleet"
  image?: string;
  noIndex?: boolean;
  /** Optional Open Graph / Twitter overrides; default to title/description */
  ogTitle?: string;
  ogDescription?: string;
  /** Optional JSON-LD structured data object(s) */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Absolute canonical URL override (e.g. a CMS-controlled canonical). */
  canonicalUrl?: string;
  /** Explicit robots directive for indexable pages (noIndex wins). */
  robots?: string;
  /** Open Graph type; defaults to "website". */
  ogType?: "website" | "article";
  imageAlt?: string;
  /** article:* Open Graph tags, used when ogType is "article". */
  article?: {
    publishedTime?: string | null;
    modifiedTime?: string | null;
    section?: string | null;
    tags?: string[];
  };
}

const SITE_URL = "https://rentwithheldy.com";
// Self-hosted default share image: a 1200x630 crop of the homepage hero
// photograph with no baked-in text (public/share-image.jpg).
const DEFAULT_IMAGE = `${SITE_URL}/share-image.jpg`;
const DEFAULT_IMAGE_WIDTH = "1200";
const DEFAULT_IMAGE_HEIGHT = "630";

const SEO = ({
  title,
  description,
  path,
  image,
  noIndex,
  ogTitle,
  ogDescription,
  jsonLd,
  canonicalUrl,
  robots,
  ogType = "website",
  imageAlt,
  article,
}: SEOProps) => {
  const { t } = useTranslation("home");
  const url = canonicalUrl ?? `${SITE_URL}${path}`;
  const socialTitle = ogTitle ?? title;
  const socialDescription = ogDescription ?? description;
  const ogImage = image
    ? image.startsWith("http")
      ? image
      : `${SITE_URL}${image}`
    : DEFAULT_IMAGE;
  const usesDefaultImage = ogImage === DEFAULT_IMAGE;
  // The default image is a crop of the hero photograph, so it shares its
  // translated description.
  const socialImageAlt = imageAlt ?? (usesDefaultImage ? t("hero.imageAlt") : undefined);
  const jsonLdArray = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <Helmet defer={false}>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        robots && <meta name="robots" content={robots} />
      )}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={socialTitle} />
      <meta property="og:description" content={socialDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      {usesDefaultImage && <meta property="og:image:type" content="image/jpeg" />}
      {usesDefaultImage && <meta property="og:image:width" content={DEFAULT_IMAGE_WIDTH} />}
      {usesDefaultImage && <meta property="og:image:height" content={DEFAULT_IMAGE_HEIGHT} />}
      {socialImageAlt && <meta property="og:image:alt" content={socialImageAlt} />}
      <meta property="og:site_name" content="Rent With Heldy" />
      {ogType === "article" && article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {ogType === "article" && article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {ogType === "article" && article?.section && (
        <meta property="article:section" content={article.section} />
      )}
      {ogType === "article" &&
        article?.tags?.map((tag) => <meta key={tag} property="article:tag" content={tag} />)}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={socialTitle} />
      <meta name="twitter:description" content={socialDescription} />
      <meta name="twitter:image" content={ogImage} />
      {socialImageAlt && <meta name="twitter:image:alt" content={socialImageAlt} />}

      {jsonLdArray.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
export { SITE_URL, DEFAULT_IMAGE };
