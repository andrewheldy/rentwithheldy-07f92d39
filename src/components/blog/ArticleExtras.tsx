import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Facebook, Link2, Linkedin, Mail, MessageCircle, Share2 } from "lucide-react";
import { useBlogFormat } from "@/components/blog/useBlogFormat";
import { safeImageSrc, type HeadingAnchor } from "@/lib/blog/content";
import { defaultCanonical } from "@/lib/blog/seo";
import type { BlogAuthor } from "@/lib/blog/types";
import { track } from "@/lib/analytics";

/* Reader features around the article body: contents, sharing, author. */

/** Shown when an article has at least this many sections. */
const TOC_MIN_SECTIONS = 3;

export function TableOfContents({ anchors }: { anchors: HeadingAnchor[] }) {
  const { t } = useBlogFormat();
  const sections = anchors.filter((anchor) => anchor.level === 2);
  if (sections.length < TOC_MIN_SECTIONS) return null;
  return (
    <nav aria-labelledby="article-toc" className="mb-10 rounded-card border border-border bg-card p-5 sm:p-6">
      <h2 id="article-toc" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("article.toc")}
      </h2>
      <ol className="mt-3 space-y-2" lang="en" dir="ltr">
        {sections.map((section, index) => (
          <li key={section.id} className="flex gap-3 text-[0.9375rem] leading-snug">
            <span className="w-5 shrink-0 text-end font-semibold tabular-nums text-primary-text" aria-hidden>
              {index + 1}
            </span>
            <a href={`#${section.id}`} className="min-w-0 font-medium text-ink underline-offset-[3px] hover:text-primary-text hover:underline">
              {section.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** The X (formerly Twitter) mark; lucide only ships the old bird. */
function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

const shareButton =
  "inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-medium text-ink transition-colors hover:border-ink/40 hover:text-primary-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function ShareLinks({ slug, title, preview = false }: { slug: string; title: string; preview?: boolean }) {
  const { t } = useBlogFormat();
  const url = defaultCanonical(slug);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const [canShare, setCanShare] = useState(false);
  const resetTimer = useRef<number>();

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => window.clearTimeout(resetTimer.current);
  }, []);

  const record = (method: string) => {
    if (!preview) track("blog_share", { post_slug: slug, method });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopy("copied");
      record("copy_link");
    } catch {
      setCopy("failed");
    }
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopy("idle"), 2500);
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url });
      record("native");
    } catch {
      /* dismissed */
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const networks: { id: string; name: string; href: string; icon: ReactNode }[] = [
    { id: "facebook", name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: <Facebook className="h-4 w-4" aria-hidden /> },
    { id: "x", name: "X", href: `https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}`, icon: <XLogo className="h-4 w-4" /> },
    { id: "linkedin", name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, icon: <Linkedin className="h-4 w-4" aria-hidden /> },
    { id: "whatsapp", name: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`, icon: <MessageCircle className="h-4 w-4" aria-hidden /> },
  ];

  return (
    <section aria-labelledby="article-share" className="mt-12">
      <h2 id="article-share" className="font-heading text-lg font-bold text-ink">
        {t("article.share.heading")}
      </h2>
      <ul className="mt-4 flex flex-wrap items-center gap-2">
        <li>
          <button type="button" className={shareButton} onClick={copyLink}>
            {copy === "copied" ? <Check className="h-4 w-4 text-emerald-700" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
            <span aria-live="polite">
              {copy === "copied" ? t("article.share.copied") : copy === "failed" ? t("article.share.copyFailed") : t("article.share.copy")}
            </span>
          </button>
        </li>
        {networks.map((network) => (
          <li key={network.id}>
            <a
              href={network.href}
              target="_blank"
              rel="noopener noreferrer"
              className={shareButton}
              aria-label={t("article.share.on", { network: network.name })}
              title={t("article.share.on", { network: network.name })}
              onClick={() => record(network.id)}
            >
              {network.icon}
            </a>
          </li>
        ))}
        <li>
          <a
            href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
            className={shareButton}
            aria-label={t("article.share.email")}
            title={t("article.share.email")}
            onClick={() => record("email")}
          >
            <Mail className="h-4 w-4" aria-hidden />
          </a>
        </li>
        {canShare && (
          <li>
            <button type="button" className={shareButton} onClick={nativeShare} aria-label={t("article.share.more")} title={t("article.share.more")}>
              <Share2 className="h-4 w-4" aria-hidden />
            </button>
          </li>
        )}
      </ul>
    </section>
  );
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}` : (words[0] ?? "").slice(0, 2)).toUpperCase();
}

export function AuthorCard({ author }: { author: BlogAuthor }) {
  const { t } = useBlogFormat();
  const photo = safeImageSrc(author.photo_url);
  return (
    <section aria-labelledby="article-author" className="mt-12 rounded-card border border-border bg-secondary/40 p-5 sm:p-6">
      <h2 id="article-author" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {t("article.aboutAuthor")}
      </h2>
      <div className="mt-4 flex items-start gap-4">
        {photo ? (
          <img src={photo} alt="" loading="lazy" decoding="async" className="h-16 w-16 shrink-0 rounded-full bg-secondary object-cover" />
        ) : (
          <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-ink font-heading text-lg font-bold text-white">
            {initials(author.name)}
          </span>
        )}
        <div className="min-w-0" lang="en" dir="ltr">
          <p className="text-start font-heading text-lg font-bold text-ink">{author.name}</p>
          {author.role && <p className="text-start text-sm text-muted-foreground">{author.role}</p>}
          {author.bio && <p className="mt-2 text-start text-[0.9375rem] leading-relaxed text-foreground/90">{author.bio}</p>}
        </div>
      </div>
    </section>
  );
}
