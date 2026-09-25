import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  ArrowRight,
  BedDouble,
  ChevronRight,
  KeyRound,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
  Star,
  Users,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO, { SITE_URL } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { useBlogFormat } from "@/components/blog/useBlogFormat";
import { fetchPublishedPosts } from "@/lib/blog/api";
import { postPath } from "@/lib/blog/seo";
import { buildBreadcrumbSchema } from "@/lib/seo-schemas";
import { normalizeLocale } from "@/i18n/config";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/lib/contact";
import { track } from "@/lib/analytics";
import hotelDelivery from "@/assets/categories/hotel-delivery.jpg";
import airportDelivery from "@/assets/categories/airport-delivery.jpg";

/* /about — the Rent With Heldy story, told briefly. Copy lives in the
   `legal` namespace under `about.*`. This page is also how visitors reach the
   blog from the main navigation (Header → About → Blog). */

const PATH = "/about";
const PAGE_URL = `${SITE_URL}${PATH}`;
const EMAIL = "rentwithheldy@gmail.com";

// Every link points at an existing route.
const SERVICES: { key: string; icon: LucideIcon; href?: string }[] = [
  { key: "airport", icon: Plane, href: "/fort-lauderdale-airport-car-rental" },
  { key: "hotel", icon: BedDouble, href: "/hotel-concierge-rentals" },
  { key: "cruise", icon: Anchor, href: "/cruise-port-delivery" },
  { key: "contactless", icon: KeyRound, href: "/how-it-works" },
  { key: "direct", icon: MessageCircle, href: "/contact" },
  { key: "local", icon: MapPin },
];

const FACTS: { key: string; icon: LucideIcon }[] = [
  { key: "reviews", icon: Star },
  { key: "allStar", icon: KeyRound },
  { key: "family", icon: Users },
];

const eyebrow = "mb-3 text-sm font-semibold uppercase tracking-wider text-primary";
const ctaButton = "h-auto min-h-12 w-full whitespace-normal py-3 sm:w-auto";

const About = () => {
  const { t, i18n } = useTranslation(["legal", "common"]);
  const { formatDate, categoryLabel } = useBlogFormat();
  const postsQuery = useQuery({ queryKey: ["blog", "posts"], queryFn: fetchPublishedPosts });
  const latestPosts = (postsQuery.data ?? []).slice(0, 2);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "@id": `${PAGE_URL}#webpage`,
      url: PAGE_URL,
      name: t("about.meta.title"),
      description: t("about.meta.description"),
      inLanguage: normalizeLocale(i18n.language),
      isPartOf: { "@type": "WebSite", name: "Rent With Heldy", url: SITE_URL },
      about: { "@type": "Organization", name: "Rent With Heldy", url: SITE_URL },
      breadcrumb: { "@id": `${PAGE_URL}#breadcrumb` },
    },
    {
      ...buildBreadcrumbSchema([
        { name: t("about.breadcrumbHome"), path: "/" },
        { name: t("about.crumb"), path: PATH },
      ]),
      "@id": `${PAGE_URL}#breadcrumb`,
    },
  ];

  const blogCta = (placement: string) => () => track("about_blog_cta_click", { placement });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO title={t("about.meta.title")} description={t("about.meta.description")} path={PATH} jsonLd={jsonLd} />
      <Header />

      <main className="flex-1">
        {/* ===== Hero ===== */}
        <section className="overflow-hidden">
          <div className="container mx-auto pb-16 pt-8 sm:pb-24">
            <nav aria-label={t("about.breadcrumbLabel")} className="mb-10 sm:mb-14">
              <ol className="flex items-center gap-1 text-sm text-muted-foreground">
                <li>
                  <Link to="/" className="hover:text-primary">{t("about.breadcrumbHome")}</Link>
                </li>
                <li className="flex items-center gap-1">
                  <ChevronRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />
                  <span aria-current="page" className="text-foreground/80">{t("about.crumb")}</span>
                </li>
              </ol>
            </nav>

            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-7">
                <p className={eyebrow}>{t("about.hero.eyebrow")}</p>
                <h1 className="font-heading text-display-lg font-bold text-ink">{t("about.hero.title")}</h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  {t("about.hero.intro")}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className={ctaButton}>
                    <Link to="/book" onClick={() => track("conversion_path_selected", { conversion_intent: "rental", placement: "about_hero" })}>
                      {t("about.hero.primaryCta")}
                      <ArrowRight className="rtl:-scale-x-100" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className={ctaButton}>
                    <Link to="/blog" onClick={blogCta("hero")}>{t("about.hero.secondaryCta")}</Link>
                  </Button>
                </div>
                <ul aria-label={t("about.facts.label")} className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-6">
                  {FACTS.map(({ key, icon: Icon }) => (
                    <li key={key} className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                      <Icon aria-hidden className={`h-4 w-4 text-primary ${key === "reviews" ? "fill-primary" : ""}`} />
                      {t(`about.facts.${key}`)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  <div aria-hidden className="absolute -inset-3 -z-10 rounded-[1.5rem] bg-secondary sm:-inset-4 lg:translate-x-4 lg:translate-y-4 rtl:lg:-translate-x-4" />
                  <img
                    src={hotelDelivery}
                    alt={t("about.hero.imageAlt")}
                    width={700}
                    height={1167}
                    decoding="async"
                    {...{ fetchpriority: "high" }}
                    className="aspect-[4/3] w-full rounded-card object-cover object-[center_62%] shadow-elevated lg:aspect-[4/5]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Philosophy ===== */}
        <section className="bg-ink py-20 text-white sm:py-28">
          <div className="container mx-auto">
            <Reveal className="mx-auto max-w-4xl text-center">
              <p className="font-heading text-display font-bold leading-tight">
                <span aria-hidden className="text-primary">“</span>
                {t("about.philosophy.quote")}
                <span aria-hidden className="text-primary">”</span>
              </p>
              <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-white/75 sm:text-xl">
                {t("about.philosophy.body")}
              </p>
            </Reveal>
          </div>
        </section>

        {/* ===== How we host ===== */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <Reveal className="lg:col-span-5">
                <p className={eyebrow}>{t("about.story.eyebrow")}</p>
                <h2 className="mb-6 font-heading text-heading font-bold text-ink">{t("about.story.heading")}</h2>
                <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                  <p>{t("about.story.p1")}</p>
                  <p>{t("about.story.p2")}</p>
                </div>
                <div className="mt-10 rounded-card border border-border bg-card p-6">
                  <h3 className="font-heading text-lg font-semibold text-ink">{t("about.serviceAreas.heading")}</h3>
                  <dl className="mt-4 space-y-4 text-sm">
                    {(["miamiDade", "broward"] as const).map((area) => (
                      <div key={area} className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        <div>
                          <dt className="font-semibold text-foreground">{t(`about.serviceAreas.${area}.title`)}</dt>
                          <dd className="mt-0.5 text-muted-foreground">{t(`about.serviceAreas.${area}.description`)}</dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>

              <div className="lg:col-span-7">
                <h2 className="sr-only">{t("about.services.heading")}</h2>
                <ul className="divide-y divide-border border-y border-border">
                  {SERVICES.map(({ key, icon: Icon, href }, index) => (
                    <Reveal as="li" key={key} delay={index * 50} className="group relative flex gap-5 py-6 sm:py-7">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading text-xl font-semibold text-ink">
                          {href ? (
                            <Link to={href} className="after:absolute after:inset-0 after:content-[''] hover:text-primary focus-visible:outline-none">
                              {t(`about.services.items.${key}.title`)}
                            </Link>
                          ) : (
                            t(`about.services.items.${key}.title`)
                          )}
                        </h3>
                        <p className="mt-1.5 leading-relaxed text-muted-foreground">{t(`about.services.items.${key}.body`)}</p>
                      </div>
                      {href && (
                        <ArrowRight aria-hidden className="mt-3 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
                      )}
                    </Reveal>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ===== From the blog ===== */}
        <section aria-labelledby="about-blog-heading" className="pb-16 sm:pb-24">
          <div className="container mx-auto">
            <Reveal className="overflow-hidden rounded-card border border-border bg-secondary">
              <div className="grid lg:grid-cols-12">
                <div className="p-8 sm:p-12 lg:col-span-6 lg:p-14">
                  <p className={eyebrow}>{t("about.blog.eyebrow")}</p>
                  <h2 id="about-blog-heading" className="font-heading text-display font-bold text-ink">
                    {t("about.blog.heading")}
                  </h2>
                  <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">{t("about.blog.body")}</p>
                  <Button asChild size="lg" className={`mt-8 ${ctaButton}`}>
                    <Link to="/blog" onClick={blogCta("blog_section")}>
                      {t("about.blog.cta")}
                      <ArrowRight className="rtl:-scale-x-100" aria-hidden />
                    </Link>
                  </Button>
                </div>
                {latestPosts.length === 0 && (
                  <div className="relative min-h-[16rem] lg:col-span-6">
                    <img
                      src={airportDelivery}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={700}
                      height={1167}
                      className="absolute inset-0 h-full w-full object-cover object-[center_58%]"
                    />
                  </div>
                )}
                {latestPosts.length > 0 && (
                  <div className="border-t border-border bg-card/60 p-8 sm:p-12 lg:col-span-6 lg:border-s lg:border-t-0 lg:p-14">
                    <ul className="divide-y divide-border">
                      {latestPosts.map((post) => (
                        <li key={post.id} className="group relative py-5 first:pt-0 last:pb-0">
                          {post.category && (
                            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{categoryLabel(post.category)}</p>
                          )}
                          <h3 lang="en" dir="ltr" className="mt-1.5 text-start font-heading text-xl font-semibold leading-snug text-ink">
                            <Link
                              to={postPath(post.slug)}
                              onClick={blogCta("latest_post")}
                              className="after:absolute after:inset-0 after:content-[''] group-hover:text-primary focus-visible:outline-none"
                            >
                              {post.title}
                            </Link>
                          </h3>
                          {post.published_at && (
                            <time dateTime={post.published_at} className="mt-1 block text-sm text-muted-foreground">
                              {formatDate(post.published_at)}
                            </time>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ===== Be Our Guest ===== */}
        <section className="border-t border-border bg-card py-16 sm:py-24">
          <div className="container mx-auto">
            <Reveal className="mx-auto max-w-3xl text-center">
              <p className="font-heading text-2xl font-semibold italic text-primary sm:text-3xl">{t("about.finalCta.eyebrow")}</p>
              <h2 className="mt-3 font-heading text-display font-bold text-ink">{t("about.finalCta.heading")}</h2>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{t("about.finalCta.body")}</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className={ctaButton}>
                  <Link to="/book" onClick={() => track("conversion_path_selected", { conversion_intent: "rental", placement: "about_final_cta" })}>
                    {t("about.finalCta.primary")}
                    <ArrowRight className="rtl:-scale-x-100" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className={ctaButton}>
                  <a href={CONTACT_PHONE_HREF} onClick={() => track("call_cta_click", { placement: "about_final_cta" })}>
                    <Phone aria-hidden />
                    <span>{t("about.finalCta.callOrText")}</span>
                    <span dir="ltr">{CONTACT_PHONE_DISPLAY}</span>
                  </a>
                </Button>
              </div>
              <a href={`mailto:${EMAIL}`} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
                <Mail className="h-4 w-4" aria-hidden />
                <span className="sr-only">{t("about.finalCta.emailLabel")}: </span>
                <span dir="ltr">{EMAIL}</span>
              </a>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
