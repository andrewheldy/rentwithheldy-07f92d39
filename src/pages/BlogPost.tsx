import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleView } from "@/components/blog/ArticleView";
import { useBlogFormat } from "@/components/blog/useBlogFormat";
import { fetchPublishedPost, fetchRelatedPosts } from "@/lib/blog/api";
import {
  articleCrumbs,
  blogPostingSchema,
  breadcrumbSchema,
  postPath,
  resolveArticleMeta,
} from "@/lib/blog/seo";
import { isValidSlug } from "@/lib/blog/slug";
import { track } from "@/lib/analytics";

/* /blog/:slug — a live article. Drafts and not-yet-due scheduled posts are
   never returned (RLS + explicit filters), so they render the not-found
   state with noindex. An old slug of a live post redirects to its current
   URL (the server function answers crawlers with a real 301). */

const BlogPost = () => {
  const { slug = "" } = useParams();
  const { t, categoryLabel } = useBlogFormat();
  const validSlug = isValidSlug(slug);

  const postQuery = useQuery({
    queryKey: ["blog", "post", slug],
    queryFn: () => fetchPublishedPost(slug),
    enabled: validSlug,
  });
  const result = postQuery.data;
  const post = result?.kind === "post" ? result.post : null;

  const relatedQuery = useQuery({
    queryKey: ["blog", "related", post?.id],
    queryFn: () => fetchRelatedPosts(post!),
    enabled: Boolean(post),
  });

  useEffect(() => {
    if (post) track("blog_article_view", { post_slug: post.slug, category: post.category?.slug ?? null });
  }, [post]);

  if (result?.kind === "redirect") return <Navigate to={postPath(result.slug)} replace />;

  const notFound = !validSlug || result?.kind === "not_found";

  // BreadcrumbList is built from the exact trail ArticleView renders.
  const jsonLd = post
    ? [
        blogPostingSchema(post),
        breadcrumbSchema(
          articleCrumbs(post, {
            blog: t("article.blog"),
            category: post.category ? categoryLabel(post.category) : undefined,
          }),
        ),
      ]
    : undefined;
  const meta = post ? resolveArticleMeta(post) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {post && meta ? (
        <SEO
          title={meta.title}
          description={meta.description}
          path={postPath(post.slug)}
          canonicalUrl={meta.canonical}
          ogTitle={meta.ogTitle}
          ogDescription={meta.ogDescription}
          image={meta.image}
          imageAlt={meta.imageAlt}
          ogType="article"
          robots="index, follow, max-image-preview:large"
          article={{
            publishedTime: meta.publishedTime,
            modifiedTime: meta.modifiedTime,
            section: post.category?.name,
            tags: post.tags.map((tag) => tag.name),
          }}
          jsonLd={jsonLd}
        />
      ) : (
        (notFound || postQuery.isError) && (
          <SEO
            title={t("article.notFound.metaTitle")}
            description={t("article.notFound.body")}
            path={postPath(slug)}
            noIndex
          />
        )
      )}
      <Header />

      <main className="flex-1">
        {post ? (
          <ArticleView post={post} related={relatedQuery.data ?? []} />
        ) : notFound || postQuery.isError ? (
          <section className="container mx-auto py-24 text-center sm:py-32">
            <div className="mx-auto max-w-xl">
              <h1 className="font-heading text-display font-bold text-ink">
                {postQuery.isError ? t("article.error") : t("article.notFound.title")}
              </h1>
              {!postQuery.isError && (
                <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{t("article.notFound.body")}</p>
              )}
              <Button asChild size="lg" className="mt-8">
                <Link to="/blog">
                  {t("article.notFound.cta")}
                  <ArrowRight className="rtl:-scale-x-100" aria-hidden />
                </Link>
              </Button>
            </div>
          </section>
        ) : (
          <div className="container mx-auto pt-12" aria-busy="true">
            <div className="mx-auto max-w-3xl space-y-5">
              <span className="sr-only">{t("index.loading")}</span>
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-5 w-full" />
            </div>
            <Skeleton className="mx-auto mt-12 aspect-[16/9] w-full max-w-5xl rounded-card" />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
