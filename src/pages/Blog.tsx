import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogCard } from "@/components/blog/BlogCard";
import { useBlogFormat } from "@/components/blog/useBlogFormat";
import { fetchCategories, fetchPublishedPosts } from "@/lib/blog/api";
import { BLOG_PATH, BLOG_URL, blogIndexSchema, breadcrumbSchema } from "@/lib/blog/seo";
import { track } from "@/lib/analytics";

/* /blog — editorial index. Category filtering happens in place via
   ?category=<slug>; only topics that actually have articles are offered, so
   there are never empty topic pages. Every filtered view canonicalizes to
   /blog. */

const Blog = () => {
  const { t, categoryLabel } = useBlogFormat();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSlug = searchParams.get("category");

  const postsQuery = useQuery({ queryKey: ["blog", "posts"], queryFn: fetchPublishedPosts });
  const categoriesQuery = useQuery({ queryKey: ["blog", "categories"], queryFn: fetchCategories });
  const posts = useMemo(() => postsQuery.data ?? [], [postsQuery.data]);

  const topics = useMemo(() => {
    const used = new Set(posts.map((p) => p.category?.slug).filter(Boolean));
    return (categoriesQuery.data ?? []).filter((c) => used.has(c.slug));
  }, [posts, categoriesQuery.data]);

  const visible = activeSlug ? posts.filter((p) => p.category?.slug === activeSlug) : posts;
  const [lead, ...rest] = visible;
  const showLead = !activeSlug && Boolean(lead);
  const grid = showLead ? rest : visible;

  const selectTopic = (slug: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("category", slug);
    else next.delete("category");
    setSearchParams(next, { replace: true, preventScrollReset: true });
    if (slug) track("blog_category_filter", { category: slug });
  };

  const pill = (active: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
      active
        ? "border-ink bg-ink text-white"
        : "border-border bg-card text-foreground/80 hover:border-ink/40 hover:text-ink"
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title={t("index.meta.title")}
        description={t("index.meta.description")}
        path={BLOG_PATH}
        canonicalUrl={BLOG_URL}
        jsonLd={[
          blogIndexSchema(posts),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: t("article.blog"), path: BLOG_PATH },
          ]),
        ]}
      />
      <Header />

      <main className="flex-1">
        {/* ===== Masthead ===== */}
        <section className="border-b border-border bg-gradient-subtle">
          <div className="container mx-auto pb-12 pt-14 sm:pb-16 sm:pt-20">
            <div className="max-w-3xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">{t("index.eyebrow")}</p>
              <h1 className="font-heading text-display-lg font-bold text-ink">{t("index.title")}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {t("index.intro")}
              </p>
            </div>

            {topics.length > 1 && (
              <div className="mt-10">
                <p id="blog-topics-label" className="sr-only">
                  {t("index.filterLabel")}
                </p>
                {/* Scrolls sideways on phones instead of wrapping into a wall of pills. */}
                <div
                  role="group"
                  aria-labelledby="blog-topics-label"
                  className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
                >
                  <button type="button" aria-pressed={!activeSlug} onClick={() => selectTopic(null)} className={pill(!activeSlug)}>
                    {t("index.allTopics")}
                  </button>
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      aria-pressed={activeSlug === topic.slug}
                      onClick={() => selectTopic(topic.slug)}
                      className={pill(activeSlug === topic.slug)}
                    >
                      {categoryLabel(topic)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto py-12 sm:py-16" aria-live="polite" aria-busy={postsQuery.isLoading}>
          {postsQuery.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <span className="sr-only">{t("index.loading")}</span>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-card border border-border bg-card">
                  <Skeleton className="aspect-[16/10] w-full rounded-none" />
                  <div className="space-y-3 p-6">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : postsQuery.isError ? (
            <p className="mx-auto max-w-xl rounded-card border border-border bg-card p-6 text-center text-muted-foreground">
              {t("index.error")}
            </p>
          ) : posts.length === 0 ? (
            <div className="mx-auto max-w-2xl py-8 text-center">
              <h2 className="font-heading text-heading font-bold text-ink">{t("index.empty.title")}</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t("index.empty.body")}</p>
              <Button asChild size="lg" className="mt-8">
                <Link to="/book">
                  {t("index.empty.cta")}
                  <ArrowRight className="rtl:-scale-x-100" aria-hidden />
                </Link>
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <div className="mx-auto max-w-xl py-8 text-center">
              <p className="text-lg text-muted-foreground">{t("index.emptyCategory")}</p>
              <Button variant="outline" className="mt-6" onClick={() => selectTopic(null)}>
                {t("index.showAll")}
              </Button>
            </div>
          ) : (
            <>
              {showLead && (
                <div className="mb-12 sm:mb-16">
                  <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t("index.latest")}</p>
                  <BlogCard post={lead} featured headingLevel="h2" />
                </div>
              )}
              {grid.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                  {grid.map((post) => (
                    <BlogCard key={post.id} post={post} headingLevel="h2" />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
