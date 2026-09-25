import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArticleContent } from "@/components/blog/ArticleContent";
import { BlogCard } from "@/components/blog/BlogCard";
import { useBlogFormat } from "@/components/blog/useBlogFormat";
import { internalPath, readingMinutes, safeHref } from "@/lib/blog/content";
import { articleCrumbs } from "@/lib/blog/seo";
import { hasMeaningfulUpdate } from "@/lib/blog/status";
import type { BlogPost, BlogPostSummary } from "@/lib/blog/types";
import { track } from "@/lib/analytics";

interface ArticleViewProps {
  post: BlogPost;
  related?: BlogPostSummary[];
  /** Admin preview: links still work, analytics are not recorded. */
  preview?: boolean;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * The public article template. The admin preview renders this exact
 * component, so a preview is a faithful picture of the published page.
 */
export function ArticleView({ post, related = [], preview = false }: ArticleViewProps) {
  const { t, locale, formatDate, categoryLabel, ctaLabel } = useBlogFormat();
  const crumbs = articleCrumbs(post, {
    blog: t("article.blog"),
    category: post.category ? categoryLabel(post.category) : undefined,
  });
  const showUpdated = hasMeaningfulUpdate(post.published_at, post.last_updated_at);
  const ctaHref = post.cta_url ? safeHref(post.cta_url) : null;
  const ctaInternal = ctaHref ? internalPath(ctaHref) : null;
  const sources = post.sources.filter((source) => safeHref(source.url));

  return (
    <article className="pb-16 sm:pb-24">
      {/* ===== Header ===== */}
      <header className="container mx-auto pt-8 sm:pt-12">
        <div className="mx-auto max-w-3xl">
          <nav aria-label={t("article.breadcrumbLabel")} className="mb-8 sm:mb-10">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              {crumbs.map((crumb, index) => {
                const last = index === crumbs.length - 1;
                return (
                  <li key={crumb.path} className="flex min-w-0 items-center gap-1">
                    {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 rtl:-scale-x-100" aria-hidden />}
                    {last ? (
                      <span aria-current="page" lang="en" dir="ltr" className="line-clamp-1 max-w-[16rem] text-foreground/80 sm:max-w-md">
                        {crumb.name}
                      </span>
                    ) : (
                      <Link to={crumb.path} className="transition-colors hover:text-primary">
                        {crumb.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          {post.category && (
            <Link
              to={crumbs[1].path}
              className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-primary hover:underline"
            >
              {categoryLabel(post.category)}
            </Link>
          )}

          <h1 lang="en" dir="ltr" className="text-start font-heading text-display font-bold text-ink">
            {post.title}
          </h1>

          {post.excerpt && (
            <p lang="en" dir="ltr" className="mt-6 text-start text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {post.excerpt}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-5 text-sm text-muted-foreground">
            <span>
              {t("article.by")} <span className="font-semibold text-foreground">{post.author}</span>
            </span>
            {post.published_at && (
              <span>
                {t("article.published")}{" "}
                <time dateTime={post.published_at} className="text-foreground/80">
                  {formatDate(post.published_at)}
                </time>
              </span>
            )}
            {showUpdated && post.last_updated_at && (
              <span>
                {t("article.updated")}{" "}
                <time dateTime={post.last_updated_at} className="text-foreground/80">
                  {formatDate(post.last_updated_at)}
                </time>
              </span>
            )}
            <span>{t("index.minRead", { count: readingMinutes(post.content) })}</span>
          </div>
        </div>
      </header>

      {/* ===== Featured image ===== */}
      {post.featured_image && (
        <figure className="container mx-auto mt-10 sm:mt-12">
          <img
            src={post.featured_image}
            alt={post.featured_image_alt ?? ""}
            width={post.featured_image_width ?? undefined}
            height={post.featured_image_height ?? undefined}
            decoding="async"
            {...{ fetchpriority: "high" }}
            className="mx-auto h-auto max-h-[36rem] w-full max-w-5xl rounded-card bg-secondary object-cover"
          />
        </figure>
      )}

      {/* ===== Body ===== */}
      <div className="container mx-auto mt-10 sm:mt-14">
        <div className="mx-auto max-w-[42rem]">
          {locale !== "en" && (
            <aside role="note" className="mb-10 rounded-card border border-border bg-secondary/50 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-semibold text-foreground">{t("article.englishNotice.heading")}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("article.englishNotice.body")}</p>
                </div>
              </div>
            </aside>
          )}

          <div lang="en" dir="ltr">
            <ArticleContent doc={post.content} />
          </div>

          {post.tags.length > 0 && (
            <div className="mt-12">
              <h2 className="sr-only">{t("article.tagsLabel")}</h2>
              <ul className="flex flex-wrap gap-2" lang="en" dir="ltr">
                {post.tags.map((tag) => (
                  <li key={tag.id} className="rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
                    {tag.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ===== Sources ===== */}
          {sources.length > 0 && (
            <section aria-labelledby="article-sources" className="mt-14 border-t border-border pt-8">
              <h2 id="article-sources" className="font-heading text-xl font-bold text-ink">
                {t("article.sourcesHeading")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("article.sourcesNote")}</p>
              <ol className="mt-5 space-y-3" lang="en" dir="ltr">
                {sources.map((source, index) => (
                  <li key={source.id ?? `${source.url}-${index}`} className="flex gap-3 text-[0.9375rem] leading-relaxed">
                    <span className="w-5 shrink-0 text-end font-semibold tabular-nums text-muted-foreground">{index + 1}.</span>
                    <span className="min-w-0">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="font-medium text-ink underline decoration-border underline-offset-[3px] transition-colors hover:text-primary hover:decoration-primary"
                      >
                        {source.name}
                        <ExternalLink className="ms-1 inline h-3.5 w-3.5 align-[-2px]" aria-hidden />
                      </a>
                      <span className="block break-words text-sm text-muted-foreground">
                        {[source.publisher, hostOf(source.url)].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>

      {/* ===== CTA ===== */}
      {post.cta_label && ctaHref && (
        <section className="container mx-auto mt-16">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-card bg-ink px-6 py-10 text-center sm:px-12 sm:py-14">
            <div aria-hidden className="pointer-events-none absolute -top-24 start-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl rtl:translate-x-1/2" />
            <p className="relative font-heading text-lg font-semibold italic text-primary">{t("article.cta.eyebrow")}</p>
            <h2 className="relative mt-3 font-heading text-heading font-bold text-white">{t("article.cta.heading")}</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              {t("article.cta.body")}
            </p>
            <Button asChild size="lg" className="relative mt-8 h-auto min-h-12 whitespace-normal py-3">
              {ctaInternal ? (
                <Link
                  to={ctaInternal}
                  onClick={() => !preview && track("blog_cta_click", { post_slug: post.slug, cta_url: ctaInternal })}
                >
                  {ctaLabel(post.cta_label, post.cta_url!)}
                  <ArrowRight className="rtl:-scale-x-100" aria-hidden />
                </Link>
              ) : (
                <a
                  href={ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => !preview && track("blog_cta_click", { post_slug: post.slug, cta_url: ctaHref })}
                >
                  {ctaLabel(post.cta_label, post.cta_url!)}
                  <ArrowRight className="rtl:-scale-x-100" aria-hidden />
                </a>
              )}
            </Button>
          </div>
        </section>
      )}

      {/* ===== Related ===== */}
      {related.length > 0 && (
        <section aria-labelledby="related-articles" className="container mx-auto mt-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 id="related-articles" className="font-heading text-heading font-bold text-ink">
              {t("article.relatedHeading")}
            </h2>
            <Link to="/blog" className="inline-flex items-center gap-1.5 font-semibold text-ink hover:text-primary">
              {t("article.allArticles")}
              <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <BlogCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

export default ArticleView;
