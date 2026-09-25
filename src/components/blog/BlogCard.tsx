import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { postPath } from "@/lib/blog/seo";
import type { BlogPostSummary } from "@/lib/blog/types";
import { useBlogFormat } from "./useBlogFormat";
import logo from "@/assets/rent-with-heldy-logo.png";

interface BlogCardProps {
  post: BlogPostSummary;
  /** The lead story: larger, side-by-side on desktop, image loads eagerly. */
  featured?: boolean;
  headingLevel?: "h2" | "h3";
}

/** Shown when a post has no featured image: a quiet branded panel, not a stock photo. */
function ImageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-subtle">
      <img src={logo} alt="" className="h-14 w-14 object-contain opacity-60" />
    </div>
  );
}

export function BlogCard({ post, featured = false, headingLevel = "h3" }: BlogCardProps) {
  const { t, formatDate, categoryLabel } = useBlogFormat();
  const Heading = headingLevel;
  const href = postPath(post.slug);

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-card border border-border bg-card shadow-card transition-[box-shadow,transform] duration-200 ease-out-expo focus-within:ring-2 focus-within:ring-primary hover:-translate-y-1 hover:shadow-card-hover motion-reduce:hover:translate-y-0 ${
        featured ? "lg:grid lg:grid-cols-12" : ""
      }`}
    >
      <div
        className={`relative overflow-hidden bg-secondary ${
          featured ? "aspect-[16/10] lg:col-span-7 lg:aspect-auto lg:min-h-[26rem]" : "aspect-[16/10]"
        }`}
      >
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.featured_image_alt ?? ""}
            width={post.featured_image_width ?? undefined}
            height={post.featured_image_height ?? undefined}
            loading={featured ? "eager" : "lazy"}
            decoding="async"
            {...(featured ? { fetchpriority: "high" } : {})}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
          />
        ) : (
          <ImageFallback />
        )}
      </div>

      <div className={`flex flex-1 flex-col p-6 ${featured ? "sm:p-8 lg:col-span-5 lg:justify-center lg:p-10" : ""}`}>
        {post.category && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
            {categoryLabel(post.category)}
          </p>
        )}
        <Heading
          lang="en"
          dir="ltr"
          className={`text-start font-heading font-bold text-ink ${
            featured ? "text-2xl leading-tight sm:text-3xl lg:text-[2.125rem]" : "text-xl leading-snug"
          }`}
        >
          {/* Stretched link: the whole card is one tab stop and one link. */}
          <Link
            to={href}
            aria-label={t("index.readArticleAria", { title: post.title })}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {post.title}
          </Link>
        </Heading>
        {post.excerpt && (
          <p
            lang="en"
            dir="ltr"
            className={`mt-3 text-start leading-relaxed text-muted-foreground ${
              featured ? "text-base sm:text-lg line-clamp-4" : "text-[0.9375rem] line-clamp-3"
            }`}
          >
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-6">
          {post.published_at && (
            <time dateTime={post.published_at} className="text-sm text-muted-foreground">
              {formatDate(post.published_at)}
            </time>
          )}
          <span aria-hidden className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition-colors group-hover:text-primary">
            {t("index.readArticle")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

export default BlogCard;
