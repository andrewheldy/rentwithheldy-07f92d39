import { Helmet } from "react-helmet-async";

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
const DEFAULT_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/CSzZLopKzRX2s7Gn49LVhaLvLQH2/social-images/social-1770324920970-Share_image_website.PNG";

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
  const url = canonicalUrl ?? `${SITE_URL}${path}`;
  const socialTitle = ogTitle ?? title;
  const socialDescription = ogDescription ?? description;
  const ogImage = image
    ? image.startsWith("http")
      ? image
      : `${SITE_URL}${image}`
    : DEFAULT_IMAGE;
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
      <meta property="og:site_name" content="Rent With Heldy" />
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
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
      {imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}

      {jsonLdArray.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
export { SITE_URL };
